import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Standard Mongoose Schema Definition
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [60, 'Full name cannot exceed 60 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a unique username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email format',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    virtualInitialCapital: {
      type: Number,
      default: 100000.00,
      immutable: true,
    },
    availableBalance: {
      type: Number,
      default: 100000.00,
    },
    portfolioValue: {
      type: Number,
      default: 100000.00,
    },
    investedBalance: {
      type: Number,
      default: 0.00,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    kycStatus: {
      type: String,
      default: 'Verified Virtual Trader',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const MongooseUserModel = mongoose.model('User', userSchema);

// In-Memory Dev Store (Active when local MongoDB service is offline)
const inMemoryUsers = [];

// Pre-seed demo user with bcrypt hashed password for immediate testing
(async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  inMemoryUsers.push({
    _id: 'usr_demo_849201',
    fullName: 'Aarav Sharma',
    username: 'aarav_trade',
    email: 'aarav.sharma@stockwise.trade',
    password: hashedPassword,
    virtualInitialCapital: 100000.00,
    availableBalance: 65500.00,
    portfolioValue: 124500.00,
    investedBalance: 50000.00,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    kycStatus: 'Verified Virtual Trader',
    createdAt: new Date('2026-10-25'),
    updatedAt: new Date(),
    matchPassword: async function (candidate) {
      return await bcrypt.compare(candidate, this.password);
    },
  });
})();

/**
 * Intelligent Data Repository:
 * If MongoDB is actively connected, delegates queries to Mongoose.
 * Otherwise, seamlessly uses the secure in-memory repository with real bcrypt hashing.
 */
class HybridUserRepository {
  get isMongoActive() {
    return mongoose.connection.readyState === 1;
  }

  findOne(query) {
    if (this.isMongoActive) {
      return MongooseUserModel.findOne(query);
    }

    const execute = () => {
      const match = inMemoryUsers.find((u) => {
        if (query.$or) {
          return query.$or.some((condition) => {
            if (condition.email && u.email === condition.email.toLowerCase()) return true;
            if (condition.username && u.username === condition.username.toLowerCase()) return true;
            return false;
          });
        }
        if (query.email && u.email !== query.email.toLowerCase()) return false;
        if (query.username && u.username !== query.username.toLowerCase()) return false;
        if (query.resetPasswordToken && u.resetPasswordToken !== query.resetPasswordToken) return false;
        if (query.resetPasswordExpire && !(u.resetPasswordExpire > Date.now())) return false;
        return true;
      });

      if (!match) return null;

      return {
        ...match,
        matchPassword: async function (candidate) {
          return await bcrypt.compare(candidate, this.password);
        },
        select: function () {
          return this;
        },
        save: async function () {
          if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
          }
          const idx = inMemoryUsers.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryUsers[idx] = this;
          return this;
        },
      };
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

  findById(id) {
    if (this.isMongoActive) {
      return MongooseUserModel.findById(id);
    }

    const execute = () => {
      const match = inMemoryUsers.find((u) => u._id.toString() === id.toString());
      if (!match) return null;

      return {
        ...match,
        matchPassword: async function (candidate) {
          return await bcrypt.compare(candidate, this.password);
        },
        select: function () {
          return this;
        },
        save: async function () {
          if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
          }
          const idx = inMemoryUsers.findIndex((x) => x._id === this._id);
          if (idx !== -1) inMemoryUsers[idx] = this;
          return this;
        },
      };
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

  async create(userData) {
    if (this.isMongoActive) {
      return await MongooseUserModel.create(userData);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fullName: userData.fullName,
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      virtualInitialCapital: 100000.00,
      availableBalance: 100000.00,
      portfolioValue: 100000.00,
      investedBalance: 0.00,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      kycStatus: 'Verified Virtual Trader',
      createdAt: new Date(),
      updatedAt: new Date(),
      matchPassword: async function (candidate) {
        return await bcrypt.compare(candidate, this.password);
      },
    };

    inMemoryUsers.push(newUser);
    return newUser;
  }
}

export const User = new HybridUserRepository();
