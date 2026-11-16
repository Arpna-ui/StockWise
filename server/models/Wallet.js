import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wallet must belong to a user'],
      unique: true,
      index: true,
    },
    availableBalance: {
      type: Number,
      default: 100000.00,
      min: [0, 'Available wallet balance cannot drop below zero'],
    },
    lockedBalance: {
      type: Number,
      default: 0.00,
      min: [0, 'Locked margin cannot be negative'],
    },
    initialGrantAmount: {
      type: Number,
      default: 100000.00,
      immutable: true, // Core rule: Cannot be altered after account creation
    },
    isInitialGrantCredited: {
      type: Boolean,
      default: true,
      immutable: true, // Only credited once upon registration
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    isVirtual: {
      type: Boolean,
      default: true,
      immutable: true,
    },
    lastTransactionAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const MongooseWalletModel = mongoose.model('Wallet', walletSchema);

// In-Memory Dev Store for Offline / Sandbox Development
const inMemoryWallets = [];

class HybridWalletRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  findOne(query) {
    if (this.isMongoActive) {
      return MongooseWalletModel.findOne(query);
    }

    const execute = () => {
      const match = inMemoryWallets.find((w) => {
        if (query.user && w.user.toString() !== query.user.toString()) return false;
        if (query._id && w._id.toString() !== query._id.toString()) return false;
        return true;
      });

      if (!match) return null;

      return {
        ...match,
        save: async function () {
          // Prevent negative balance
          if (this.availableBalance < 0) {
            throw new Error('Wallet balance cannot drop below zero.');
          }
          const idx = inMemoryWallets.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryWallets[idx] = this;
          return this;
        },
      };
    };

    return {
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
      return await MongooseWalletModel.create(data);
    }

    const newWallet = {
      _id: `wlt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: data.user,
      availableBalance: data.availableBalance !== undefined ? Number(data.availableBalance) : 100000.00,
      lockedBalance: data.lockedBalance !== undefined ? Number(data.lockedBalance) : 0.00,
      initialGrantAmount: 100000.00,
      isInitialGrantCredited: true,
      currency: 'INR',
      currencySymbol: '₹',
      isVirtual: true,
      lastTransactionAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        if (this.availableBalance < 0) {
          throw new Error('Wallet balance cannot drop below zero.');
        }
        const idx = inMemoryWallets.findIndex((x) => x._id === this._id);
        if (idx !== -1) inMemoryWallets[idx] = this;
        return this;
      },
    };

    inMemoryWallets.push(newWallet);
    return newWallet;
  }
}

export const Wallet = new HybridWalletRepository();
