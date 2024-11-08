const axios = require('axios');
const Product = require('../models/Product');

// Initialize database by fetching data from third-party API
const initializeDatabase = async (req, res) => {
    try {
        console.log("Fetching data from third-party API...");

        // Fetch data from the API
        const { data } = await axios.get(process.env.THIRD_PARTY_API_URL);

        console.log("Data fetched from API:", data.length, "records");

        // Clear existing data to avoid duplication
        await Product.deleteMany();

        // Insert new data into MongoDB
        await Product.insertMany(data);

        console.log("Data successfully inserted into the database.");
        res.status(200).json({ message: 'Database initialized with seed data.' });
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).json({ error: 'Failed to initialize database' });
    }
};

// List transactions with search and pagination
const listTransactions = async (req, res) => {
    try {
        const { page = 1, perPage = 10, search = '', month } = req.query;
        console.log('Request received:', { page, perPage, search, month });
        
        const monthNumber = new Date(Date.parse(month + " 1, 2021")).getMonth() + 1;
        const query = {
            dateOfSale: { $regex: `^2021-${monthNumber < 10 ? '0' : ''}${monthNumber}-` }
        };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: parseFloat(search) || 0 }
            ];
        }

        const transactions = await Product.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        console.log('Transactions found:', transactions.length);
        return { transactions };
    } catch (error) {
        console.error('Error in listTransactions:', error);
        throw new Error('Error fetching transactions');
    }
};

// Get statistics for a given month
const getStatistics = async (req, res) => {
    try {
        const { month } = req.query;
        const monthNumber = new Date(Date.parse(month + " 1, 2021")).getMonth() + 1;
        const query = {
            dateOfSale: { $regex: `^2021-${monthNumber < 10 ? '0' : ''}${monthNumber}-` }
        };

        const totalSales = await Product.aggregate([
            { $match: { ...query, isSold: true } },
            { $group: { _id: null, totalAmount: { $sum: "$price" }, totalSoldItems: { $sum: 1 } } }
        ]);

        const totalUnsoldItems = await Product.countDocuments({ ...query, isSold: false });

        console.log('Statistics:', { totalSales, totalUnsoldItems });
        return {
            totalSaleAmount: totalSales[0]?.totalAmount || 0,
            totalSoldItems: totalSales[0]?.totalSoldItems || 0,
            totalUnsoldItems
        };
    } catch (error) {
        console.error('Error fetching statistics:', error);
        throw new Error('Error fetching statistics');
    }
};

// Get bar chart data for price ranges within a specified month
const getBarChart = async (req, res) => {
    try {
        const { month } = req.query;
        const monthNumber = new Date(Date.parse(month + " 1, 2021")).getMonth() + 1;
        const query = {
            dateOfSale: { $regex: `^2021-${monthNumber < 10 ? '0' : ''}${monthNumber}-` }
        };

        const ranges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901+', min: 901, max: Infinity }
        ];

        const barData = await Promise.all(ranges.map(async ({ range, min, max }) => {
            const count = await Product.countDocuments({ 
                ...query,
                price: { $gte: min, $lt: max === Infinity ? undefined : max }
            });
            return { range, count };
        }));

        console.log('Bar chart data:', barData);
        return { barData };
    } catch (error) {
        console.error('Error fetching bar chart data:', error);
        throw new Error('Error fetching bar chart data');
    }
};

// Get pie chart data for categories within a specified month
const getPieChart = async (req, res) => {
    try {
        const { month } = req.query;
        const monthNumber = new Date(Date.parse(month + " 1, 2021")).getMonth() + 1;
        const query = {
            dateOfSale: { $regex: `^2021-${monthNumber < 10 ? '0' : ''}${monthNumber}-` }
        };

        const pieData = await Product.aggregate([
            { $match: query },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $project: { category: "$_id", count: 1, _id: 0 } }
        ]);

        console.log('Pie chart data:', pieData);
        return { pieData };
    } catch (error) {
        console.error('Error fetching pie chart data:', error);
        throw new Error('Error fetching pie chart data');
    }
};

// Get combined data for transactions, statistics, bar chart, and pie chart
const getCombinedData = async (req, res) => {
    try {
        const { month } = req.query;

        const transactionsResult = await listTransactions(req);
        const statisticsResult = await getStatistics(req);
        const barChartResult = await getBarChart(req);
        const pieChartResult = await getPieChart(req);

        console.log('Combined data:', { transactionsResult, statisticsResult, barChartResult, pieChartResult });

        res.status(200).json({
            transactions: transactionsResult.transactions,
            statistics: statisticsResult,
            barChart: barChartResult.barData,
            pieChart: pieChartResult.pieData
        });
    } catch (error) {
        console.error('Error fetching combined data:', error);
        res.status(500).json({ error: 'Error fetching combined data' });
    }
};

// Export all functions
module.exports = {
    initializeDatabase,
    listTransactions,
    getStatistics,
    getBarChart,
    getPieChart,
    getCombinedData
};
