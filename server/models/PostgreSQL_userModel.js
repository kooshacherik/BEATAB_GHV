
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/PostgreSQL_db.js'; // Assuming you have a sequelize instance configured in a separate file

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    defaultValue: "+94722526652",
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: "https://ipac.svkkl.cz/arl-kl/en/csg/?repo=klrepo&key=52084842018",
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
});

class Accommodation extends Model {}

Accommodation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nearestUniversity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  beds: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  furnished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  area: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amenities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  photos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  lat: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  lng: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  deposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  billsIncluded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  minimumStay: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  availableFrom: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // This should reference the User model directly, not a string
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('Available', 'Occupied'),
    defaultValue: 'Available',
  },
}, {
  sequelize,
  modelName: 'Accommodation',
  tableName: 'accommodations',
  timestamps: true,
});

// Define the UserFavoriteAccommodations join table
const UserFavoriteAccommodation = sequelize.define('UserFavoriteAccommodation', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  accommodationId: {
    type: DataTypes.INTEGER,
    references: {
      model: Accommodation,
      key: 'id',
    },
  },
}, {
  tableName: 'user_favorite_accommodations',
  timestamps: false,
});

// Define associations
User.belongsToMany(Accommodation, { through: UserFavoriteAccommodation, foreignKey: 'userId' });
Accommodation.belongsToMany(User, { through: UserFavoriteAccommodation, foreignKey: 'accommodationId' });
User.hasMany(Accommodation, { foreignKey: 'userId' });
Accommodation.belongsTo(User, { foreignKey: 'userId' });

export { User, Accommodation, UserFavoriteAccommodation };

