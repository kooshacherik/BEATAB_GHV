import { Schema, model } from 'mongoose';

const userSchema = Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    default: "+94722526652", 
  },
  profilePicture: {
    type: String,
    default: "https://ipac.svkkl.cz/arl-kl/en/csg/?repo=klrepo&key=52084842018"
  },
  role : {
    type: String,
    required: true,
    default: 'user',
  },
  FavoriteAccommodations: {
    type: [Schema.Types.ObjectId],
    ref: 'Accommodation',
  },

}, { timestamps: true });


const User = model('User', userSchema);

export default User;