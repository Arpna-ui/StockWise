import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, 'Stock symbol is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    exchange: {
      type: String,
      default: 'NSE',
      enum: ['NSE', 'BSE', 'BOTH'],
      uppercase: true,
      trim: true,
    },
    sector: {
      type: String,
      required: [true, 'Industry sector is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Current market price is required'],
      min: [0, 'Stock price cannot be negative'],
    },
    change: {
      type: Number,
      default: 0.00,
    },
    changePercent: {
      type: Number,
      default: 0.00,
    },
    dayHigh: Number,
    dayLow: Number,
    high52: Number,
    low52: Number,
    openPrice: Number,
    prevClose: Number,
    volume: {
      type: String,
      default: '1.0M',
    },
    volumeRaw: {
      type: Number,
      default: 1000000,
    },
    marketCap: {
      type: String,
      default: '₹1.0 Lakh Cr',
    },
    marketCapRaw: {
      type: Number,
      default: 100000,
    },
    pe: {
      type: Number,
      default: 20.0,
    },
    about: {
      type: String,
      trim: true,
    },
    chartData: {
      type: mongoose.Schema.Types.Mixed,
    },
    marketDepth: {
      type: mongoose.Schema.Types.Mixed,
    },
    dataSource: {
      type: String,
      enum: ['LIVE', 'DELAYED_15MIN', 'SAMPLE_DATA'],
      default: 'SAMPLE_DATA',
    },
    dataSourceLabel: {
      type: String,
      default: 'Sample Market Data (NSE/BSE Reference)',
    },
    isSimulated: {
      type: Boolean,
      default: true,
    },
    isIndex: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MongooseStockModel = mongoose.model('Stock', stockSchema);

// In-Memory Dev Store
const inMemoryStocks = [];

class HybridStockRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  find(query = {}) {
    if (this.isMongoActive) {
      return MongooseStockModel.find(query);
    }

    let skipCount = 0;
    let limitCount = null;
    let sortField = null;
    let sortOrder = -1;

    const execute = () => {
      let filtered = inMemoryStocks.filter((s) => {
        if (query.isIndex !== undefined && s.isIndex !== query.isIndex) return false;
        if (query.sector && s.sector.toLowerCase() !== query.sector.toLowerCase()) return false;
        if (query.exchange && query.exchange !== 'ALL' && s.exchange !== query.exchange) return false;
        if (query.isActive !== undefined && s.isActive !== query.isActive) return false;
        return true;
      });

      if (sortField) {
        filtered.sort((a, b) => {
          const valA = a[sortField];
          const valB = b[sortField];
          if (typeof valA === 'string') {
            return sortOrder === 1 ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === 1 ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });
      }

      if (skipCount > 0) {
        filtered = filtered.slice(skipCount);
      }

      if (limitCount !== null) {
        filtered = filtered.slice(0, limitCount);
      }

      return filtered;
    };

    const queryObj = {
      sort: function (sortBy) {
        if (typeof sortBy === 'object' && sortBy !== null) {
          const key = Object.keys(sortBy)[0];
          sortField = key;
          sortOrder = sortBy[key] === 1 || sortBy[key] === 'asc' ? 1 : -1;
        } else if (typeof sortBy === 'string') {
          if (sortBy.startsWith('-')) {
            sortField = sortBy.substring(1);
            sortOrder = -1;
          } else {
            sortField = sortBy;
            sortOrder = 1;
          }
        }
        return this;
      },
      skip: function (n) {
        skipCount = Number(n) || 0;
        return this;
      },
      limit: function (n) {
        limitCount = Number(n);
        return this;
      },
      select: function () {
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

    return queryObj;
  }

  findOne(query) {
    if (this.isMongoActive) {
      return MongooseStockModel.findOne(query);
    }

    const execute = () => {
      return inMemoryStocks.find((s) => {
        if (query.symbol && s.symbol !== query.symbol.toUpperCase()) return false;
        if (query._id && s._id.toString() !== query._id.toString()) return false;
        return true;
      }) || null;
    };

    return {
      select: function () {
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
      return await MongooseStockModel.create(data);
    }

    const idx = inMemoryStocks.findIndex((s) => s.symbol === data.symbol.toUpperCase());
    if (idx !== -1) {
      inMemoryStocks[idx] = {
        ...inMemoryStocks[idx],
        ...data,
        symbol: data.symbol.toUpperCase(),
        updatedAt: new Date(),
      };
      return inMemoryStocks[idx];
    }

    const newStock = {
      _id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...data,
      symbol: data.symbol.toUpperCase(),
      exchange: data.exchange || 'NSE',
      volumeRaw: data.volumeRaw || 1000000,
      marketCapRaw: data.marketCapRaw || 100000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryStocks.push(newStock);
    return newStock;
  }

  async countDocuments(query = {}) {
    if (this.isMongoActive) {
      return await MongooseStockModel.countDocuments(query);
    }

    return inMemoryStocks.filter((s) => {
      if (query.isIndex !== undefined && s.isIndex !== query.isIndex) return false;
      if (query.sector && s.sector.toLowerCase() !== query.sector.toLowerCase()) return false;
      if (query.exchange && query.exchange !== 'ALL' && s.exchange !== query.exchange) return false;
      if (query.isActive !== undefined && s.isActive !== query.isActive) return false;
      return true;
    }).length;
  }
}

export const Stock = new HybridStockRepository();
