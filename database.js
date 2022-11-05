const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

// Recipe Schemas  ----------------------------------------------------------

const ingredientSchema = new Schema({
  name: { type: String, required: true },
  amount: Number,
  unit: String,
  id: Number,
  image: String,
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

const recipeSchema = new Schema({
  title: { type: String, required: true },
  sourceName: String,
  preparationMinutes: Number,
  cookingMinutes: Number,
  servings: Number,
  extendedIngredients: [ingredientSchema],
  analyzedInstructions: [],
});

const linkRecipeSchema = new Schema({
  recipeName: { type: String, required: true },
  recipeLink: { type: String, required: true },
});

const Recipe = mongoose.model("Recipe", recipeSchema);
const LinkRecipe = mongoose.model("LinkRecipe", linkRecipeSchema);

const favoriteRecipeSchema = new Schema({
  source: { type: String, required: true },
  recipe: { type: Object, required: true },
});

const FavoriteRecipe = mongoose.model("FavoriteRecipe", favoriteRecipeSchema);

const mealPlanSchema = new Schema({
  startDate: { type: String, required: true },
  length: { type: Number, required: true },
  plan: { type: Array, required: true },
});

const MealPlan = mongoose.model("MealPlan", mealPlanSchema);

// User Schemas & Methods

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  marketing: { type: Boolean, required: true },
  favorites: [favoriteRecipeSchema],
  recipes: [recipeSchema],
  lists: [String],
  mealPlans: [String],
});

const User = mongoose.model("User", userSchema);

// User Methods --------------------------------------------------------------
const createAndSaveUser = async (userObj, done) => {
  await findUserByEmail(userObj.email, (err, data) => {
    if (err) return console.error(err);
    if (data) {
      return done({ message: "A user with this email already exists" }, null);
    }

    bcrypt.hash(userObj.password, 10, function (err, hash) {
      if (err) return console.error(err);

      // Store hash in your password DB.
      const newUser = new User({
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        password: hash,
        marketing: userObj.marketing,
      });

      newUser.save((err, data) => {
        if (err) {
          done(err, null);
        } else {
          // console.log(data);
          const {
            firstName,
            lastName,
            email,
            id,
            favorites,
            recipes,
            lists,
            mealPlans,
            marketing,
          } = data;

          done(null, {
            firstName,
            lastName,
            email,
            userId: id,
            favorites,
            recipes,
            lists,
            mealPlans,
            marketing,
          });
        }
      });
    });
  });
};

const findUserById = async (id, done) => {
  User.findById(id, (err, user) => {
    if (err) return done(err, null);
    // if (user) console.log("user exists: ", true);
    const {
      firstName,
      lastName,
      email,
      id,
      favorites,
      recipes,
      lists,
      mealPlans,
      marketing,
    } = user;
    done(null, {
      firstName,
      lastName,
      email,
      userId: id,
      favorites,
      recipes,
      lists,
      mealPlans,
      marketing,
    });
  });
};

// findUserById("63299a5fa0cb726d740a6e00", (err, data) => {
//   if (err) return console.error(err);
//   console.log("found: ", data);
// });

const findUserByEmail = async (email, done) => {
  User.findOne({ email: email }, (err, user) => {
    if (err) return done(err, null);
    // if (user) console.log("user exists: ", true);
    done(null, user);
  });
};

// findUserByEmail("matthastings85@gmail.com", (err, data) => {
//   if (err) return console.error(err);
//   console.log("found: ", data);
// });

const authenticateUser = async (email, password, done) => {
  await findUserByEmail(email, (err, data) => {
    if (err) return console.error(err);

    if (!data)
      return done({ message: "A user with this email does not exists" }, null);

    // compare password
    bcrypt.compare(password, data.password, function (err, result) {
      if (err) return console.error(err);
      // console.log(data);
      const {
        firstName,
        lastName,
        email,
        id,
        favorites,
        recipes,
        lists,
        mealPlans,
        marketing,
      } = data;
      result
        ? done(null, {
            firstName,
            lastName,
            email,
            userId: id,
            favorites,
            recipes,
            lists,
            mealPlans,
            marketing,
          })
        : done({ message: "Password doesn't match" }, null);
    });
  });
};

const removeUserByEmail = (email, done) => {
  User.deleteOne({ email: email }, (err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

// removeUserByEmail("matthastings85@gmail.com", (err, data) => {
//   if (err) return console.error(err);
//   console.log("removed: ", data);
// });

const unsubscribeUserById = async (userId, done) => {
  const user = await User.findById(userId);

  if (!user) {
    done({ message: "user not found" }, null);
  } else {
    user.marketing = false;
    user.markModified("marketing");
    await user.save();

    console.log(user);
    const {
      firstName,
      lastName,
      email,
      marketing,
      recipes,
      favorites,
      lists,
      mealPlans,
      id,
    } = user;

    done(null, {
      firstName,
      lastName,
      email,
      marketing,
      userId: id,
      favorites,
      recipes,
      lists,
      mealPlans,
    });
  }
};

const subscribeUserById = async (userId, done) => {
  const user = await User.findById(userId);

  if (!user) {
    done({ message: "user not found" }, null);
  } else {
    user.marketing = true;
    user.markModified("marketing");
    await user.save();

    console.log(user);
    const {
      firstName,
      lastName,
      email,
      marketing,
      recipes,
      favorites,
      lists,
      mealPlans,
      id,
    } = user;

    done(null, {
      firstName,
      lastName,
      email,
      marketing,
      userId: id,
      favorites,
      recipes,
      lists,
      mealPlans,
    });
  }
};

// Recipe Methods ----------------------------------------------------------

const createAndSaveRecipe = async ({ recipe, userId }, done) => {
  const newRecipe = new Recipe(recipe);
  newRecipe.save(async (err, data) => {
    if (err) {
      done(err, null);
    } else {
      // console.log("Recipe ID: ", data);

      // Add Recipe to user
      const user = await User.findById(userId);
      console.log("found: ", user);
      user.recipes.push(data);

      await user.save();
      // console.log("upadate: ", user);

      const {
        firstName,
        lastName,
        email,
        marketing,
        recipes,
        favorites,
        lists,
        mealPlans,
        id,
      } = user;
      done(null, {
        recipe: data,
        user: {
          firstName,
          lastName,
          email,
          marketing,
          userId: id,
          favorites,
          recipes,
          lists,
          mealPlans,
        },
      });
    }
  });
};
const createAndSaveLinkRecipe = async ({ recipe, userId }, done) => {
  const newRecipe = new LinkRecipe(recipe);
  newRecipe.save(async (err, data) => {
    if (err) {
      done(err, null);
    } else {
      console.log("Recipe ID: ", data);

      // Add Recipe to user
      const user = await User.findById(userId);
      // console.log("found: ", user);
      user.recipes.push(data.id);

      await user.save();
      // console.log("upadate: ", user);
      const recipes = user.recipes;
      done(null, { ...data, recipes });
    }
  });
};

const addFavoriteRecipe = async ({ recipe, source, userId }, done) => {
  const newFavorite = new FavoriteRecipe({ source, recipe });
  newFavorite.save(async (err, data) => {
    if (err) {
      done(err, null);
    } else {
      // console.log("Recipe ID: ", data.id);

      // Add Recipe to user
      const user = await User.findById(userId);
      // console.log("found: ", user);
      user.favorites.push(data);

      user.markModified("favorites");
      await user.save();
      // console.log("updated: ", user);
      const favorites = user.favorites;
      done(null, { ...data, favorites });
    }
  });
};

const removeFavoriteById = async ({ favoriteId, userId }, done) => {
  FavoriteRecipe.deleteOne({ _id: favoriteId }, async (err, data) => {
    if (err) return console.error(err);

    const user = await User.findById(userId);
    const index = user.favorites.findIndex((item) => item.id === favoriteId);

    user.favorites.splice(index);
    user.markModified("mealPlans");
    await user.save();
    console.log("updated user: ", user);

    const {
      firstName,
      lastName,
      email,
      marketing,
      favorites,
      recipes,
      lists,
      mealPlans,
      id,
    } = user;

    done(null, {
      data,
      user: {
        firstName,
        lastName,
        email,
        marketing,
        favorites,
        recipes,
        lists,
        mealPlans,
        userId: id,
      },
    });
  });
};

const removeRecipeById = (id, done) => {
  Recipe.deleteOne({ _id: id }, (err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};
const removeLinkRecipeById = (id, done) => {
  LinkRecipe.deleteOne({ _id: id }, (err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

// removeRecipeById("6330d452e37cb06aa5449995", (err, data) => {
//   if (err) return console.error(err);
//   console.log("removed: ", data);
// });
// removeLinkRecipeById("6330d8df71c827bf13fc1eb2", (err, data) => {
//   if (err) return console.error(err);
//   console.log("removed: ", data);
// });

// List Schema -------------------------------------------------------------------

const listSchema = new Schema({
  mealPlanId: { type: String, required: true },
  list: [],
  acquired: [],
});

const List = mongoose.model("List", listSchema);

// List Methods -------------------------------------------------------------------
const createAndSaveList = async ({ list, userId, mealPlanId }, done) => {
  const newList = new List({ mealPlanId, list });
  newList.save(async (err, data) => {
    if (err) {
      done(err, null);
    } else {
      // Add list to user
      const user = await User.findById(userId);
      // console.log("found: ", user);
      user.lists.push(data.id);

      user.markModified("lists");
      await user.save();
      // console.log("user Saved: ", user);

      const {
        firstName,
        lastName,
        email,
        marketing,
        favorites,
        recipes,
        lists,
        mealPlans,
        id,
      } = user;

      done(null, {
        listId: data.id,
        user: {
          firstName,
          lastName,
          email,
          marketing,
          userId: id,
          favorites,
          recipes,
          lists,
          mealPlans,
        },
      });
    }
  });
};

const findListById = async (id, done) => {
  List.findById(id, (err, mealPlan) => {
    if (err) return done(err, null);
    // if (mealPlan) console.log("list exists: ", true);
    done(null, mealPlan);
  });
};

const updateList = async ({ acquiredList, listList, listId }, done) => {
  const targetList = await List.findById(listId);

  targetList.list = listList;
  targetList.acquired = acquiredList;

  targetList.markModified("list");
  targetList.markModified("acquired");
  await targetList.save();

  done(null, targetList);
};

// Meal Plan Methods --------------------------------------------------------------
const createAndSaveMealPlan = async ({ mealPlan, userId }, done) => {
  const newMealPlan = new MealPlan(mealPlan);
  newMealPlan.save(async (err, data) => {
    if (err) {
      done(err, null);
    } else {
      // console.log("meal plan: ", data);

      // Add meal plan to user
      const user = await User.findById(userId);
      // console.log("found: ", user);
      user.mealPlans.push(data.id);

      user.markModified("mealPlans");
      await user.save();
      // console.log("user Saved: ", user);

      const {
        firstName,
        lastName,
        email,
        marketing,
        favorites,
        recipes,
        lists,
        mealPlans,
        id,
      } = user;

      done(null, {
        mealPlanId: data.id,
        user: {
          firstName,
          lastName,
          email,
          marketing,
          favorites,
          recipes,
          lists,
          mealPlans,
          userId: id,
        },
      });
    }
  });
};

const updateMealPlan = async ({ recipe, index, mealPlanId }, done) => {
  // console.log("mealplanid: ", mealPlanId);
  const mealPlan = await MealPlan.findById(mealPlanId);
  // console.log("found: ", mealPlan);
  mealPlan.plan[index].recipe = recipe;

  mealPlan.markModified("plan");
  await mealPlan.save();
  // console.log("Meal Plan Saved: ", mealPlan);

  done(null, mealPlan);
};

const findMealPlanById = async (id, done) => {
  MealPlan.findById(id, (err, mealPlan) => {
    if (err) return done(err, null);
    // if (mealPlan) console.log("mealPlan exists: ", true);
    done(null, mealPlan);
  });
};

const removeMealPlanById = async (mealPlanId, userId, done) => {
  MealPlan.deleteOne({ _id: mealPlanId }, async (err, data) => {
    if (err) {
      console.error(err);
      return done(err, null);
    }

    // Remove meal plan from user
    const user = await User.findById(userId);
    const index = user.mealPlans.findIndex((id) => id === mealPlanId);
    user.mealPlans.splice(index);

    // Remove associated List
    List.findOneAndDelete({ mealPlanId: mealPlanId }, async (err, listData) => {
      if (err) {
        console.error(err);
      }
      if (listData) {
        const deleteList = listData._id;

        // Remove list from user
        const listIndex = user.lists.findIndex((id) => id === deleteList);
        user.lists.splice(listIndex);
        user.markModified("lists");
      }

      user.markModified("mealPlans");
      await user.save();
      console.log("updated user: ", user);

      const {
        firstName,
        lastName,
        email,
        marketing,
        favorites,
        recipes,
        lists,
        mealPlans,
        id,
      } = user;

      done(null, {
        data,
        user: {
          firstName,
          lastName,
          email,
          marketing,
          favorites,
          recipes,
          lists,
          mealPlans,
          userId: id,
        },
      });
    });
  });
};

// findMealPlanById("63396eb4fe10f34305407e3f", (err, data) => {
//   if (err) return console.error(err);
//   console.log("found: ", data);
// });

// removeMealPlanById("6339673406f58419e1a822d2", (err, data) => {
//   if (err) return console.error(err);
//   console.log("removed: ", data);
// });

// updateMealPlan(
//   {
//     recipe: { recipe: "here you go" },
//     index: 2,
//     mealPlanId: "6339673406f58419e1a822d2",
//   },
//   (err, data) => {
//     if (err) return console.log({ error: true, message: err.message });

//     return console.log(data);
//   }
// );

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    () => {
      console.log("connected to mongoDB");
    },
    (err) => {
      console.log(err);
    }
  );

exports.createAndSaveUser = createAndSaveUser;
exports.authenticateUser = authenticateUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createAndSaveRecipe = createAndSaveRecipe;
exports.createAndSaveLinkRecipe = createAndSaveLinkRecipe;
exports.addFavoriteRecipe = addFavoriteRecipe;
exports.createAndSaveMealPlan = createAndSaveMealPlan;
exports.updateMealPlan = updateMealPlan;
exports.findMealPlanById = findMealPlanById;
exports.createAndSaveList = createAndSaveList;
exports.findListById = findListById;
exports.updateList = updateList;
exports.removeMealPlanById = removeMealPlanById;
exports.removeFavoriteById = removeFavoriteById;
exports.unsubscribeUserById = unsubscribeUserById;
exports.subscribeUserById = subscribeUserById;
