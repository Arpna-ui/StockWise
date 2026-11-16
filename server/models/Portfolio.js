import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Portfolio must be linked to a user'],
      unique: true,
      index: true,
    },
    totalValue: {
      type: Number,
      default: 100000.00,
      min: [0, 'Total portfolio value cannot be negative'],
    },
    cashBalance: {
      type: Number,
      default: 100000.00,
      min: [0, 'Cash balance cannot be negative'],
    },
    investedAmount: {
      type: Number,
      default: 0.00,
      min: [0, 'Invested amount cannot be negative'],
    },
    unrealizedPnL: {
      type: Number,
      default: 0.00,
    },
    realizedPnL: {
      type: Number,
      default: 0.00,
    },
    dayChange: {
      type: Number,
      default: 0.00,
    },
    dayChangePercent: {
      type: Number,
      default: 0.00,
    },
    isVirtual: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MongoosePortfolioModel = mongoose.model('Portfolio', portfolioSchema);

// In-Memory Dev Store for Offline Development
const inMemoryPortfolios = [];

const wrapPortfolio = (p) => {
  if (!p) return null;
  return {
    ...p,
    save: async function () {
      const idx = inMemoryPortfolios.findIndex((x) => x._id === this._id);
      if (idx !== -1) inMemoryPortfolios[idx] = this;
      return this;
    },
  };
};

class HybridPortfolioRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  findOne(query) {
    if (this.isMongoActive) {
      return MongoosePortfolioModel.findOne(query);
    }

    const execute = () => {
      const match = inMemoryPortfolios.find((p) => {
        if (query.user && p.user.toString() !== query.user.toString()) return false;
        if (query._id && p._id.toString() !== query._id.toString()) return false;
        return true;
      });

      return wrapPortfolio(match);
    };

    return {
      populate: function () {
        return this;
      },
      then: function (resolve, reject) {
        try {
          resolve(execute());
        } catch (err) {
          reject(err);
        }
      },
      catch: function (reject) {
        return this.then(null, reject);
      },
    };
  }

  async create(data) {
    if (this.isMongoActive) {
      return await MongoosePortfolioModel.create(data);
    }

    const newPortfolio = {
      _id: `port_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      totalValue: data.totalValue ?? 100000.00,
      cashBalance: data.cashBalance ?? 100000.00,
      investedAmount: data.investedAmount ?? 0.00,
      unrealizedPnL: data.unrealizedPnL ?? 0.00,
      realizedPnL: data.realizedPnL ?? 0.00,
      dayChange: data.dayChange ?? 0.00,
      dayChangePercent: data.dayChangePercent ?? 0.00,
      isVirtual: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryPortfolios.push(newPortfolio);
    return wrapPortfolio(newPortfolio);
  }
}

export const Portfolio = new HybridPortfolioRepository();
