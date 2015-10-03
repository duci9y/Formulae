var Sequelize = require('sequelize');

var sequelize;
if (process.env.RDS_HOSTNAME) sequelize = new Sequelize(process.env.RDS_DB_NAME, process.env.RDS_USERNAME, process.env.RDS_PASSWORD, {
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT
});
else sequelize = new Sequelize('db', 'root', null, {
    host: '127.0.0.1'
});

var Formula = sequelize.define('formula', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    formula: {
        type: Sequelize.STRING,
        allowNull: false
    },
    html: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    comments: {
        type: Sequelize.TEXT
    }
}, {
    timestamps: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});

var Feedback = sequelize.define('feedback', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    message: Sequelize.TEXT
});

Formula.sync();
Feedback.sync();

module.exports = {
    Formula: Formula,
    Feedback: Feedback,
    sequelize: sequelize
};