const express = require("express");
// const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");

const {
  createAndSaveUser,
  authenticateUser,
  findUserByEmail,
  findUserById,
  createAndSaveRecipe,
  createAndSaveLinkRecipe,
  addFavoriteRecipe,
  createAndSaveMealPlan,
  updateMealPlan,
  findMealPlanById,
  createAndSaveList,
  findListById,
  updateList,
  removeMealPlanById,
  removeFavoriteById,
} = require("./database");

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
// const checkJwt = auth({
//   audience: "http://meals-app.matthastings.online/",
//   issuerBaseURL: `https://dev-hy08ntuo.us.auth0.com/`,
// });

const router = express.Router();

//New User
router.post("/newuser/post", async (req, res) => {
  const newUser = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    marketing: req.body.marketing,
  };

  await createAndSaveUser(newUser, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });
    req.session.userId = data.id;
    res
      .status(200)
      .json({ error: false, message: "user successfully created", data });
  });
});

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(200)
      .json({ error: true, message: "Email & Password are required." });
  await authenticateUser(email, password, (err, data) => {
    if (err) return res.status(200).json({ error: true, message: err.message });
    req.session.userId = data.id;
    res.status(200).json({ error: false, message: "user authenticated", data });
  });
});

//Get user by ID Method
router.get("/get/:id", async (req, res) => {
  console.log("param: ", req.params.id);
  await findUserById(req.params.id, (err, data) => {
    console.log("find user: ", data);
    if (err) {
      return res.json({ error: true, message: "failed to get user info" });
    } else {
      if (data) {
        return res.status(200).json({
          error: false,
          message: "user found",
          user: data,
        });
      } else {
        return res.status(200).json({ error: true, message: "user not found" });
      }
    }
  });
});

//New Custom Recipe
router.post("/newrecipe/post", async (req, res) => {
  const recipe = req.body.newRecipe;
  const userId = req.body.userId;

  await createAndSaveRecipe({ recipe, userId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "recipe successfully created", data });
  });
});

//New Link Recipe
router.post("/newlinkrecipe/post", async (req, res) => {
  const recipe = req.body.newRecipe;
  const userId = req.body.userId;

  await createAndSaveLinkRecipe({ recipe, userId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "recipe successfully created", data });
  });
});

// Favorite Recipe
router.post("/favoriterecipe/post", async (req, res) => {
  const recipe = req.body.recipe;
  const source = req.body.source;
  const userId = req.body.userId;

  console.log({ recipe, source, userId });

  await addFavoriteRecipe({ recipe, source, userId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "recipe successfully saved", data });
  });
});

// Remove Favorite Recipe
router.delete(
  "/favoriterecipe/delete/:favoriteId&:userId",
  async (req, res) => {
    const favoriteId = req.params.favoriteId;
    const userId = req.params.userId;
    console.log("param: ", req.params, favoriteId, userId);
    await removeFavoriteById({ favoriteId, userId }, (err, data) => {
      console.log(data);
      if (err) {
        return res.json({ error: true, message: "failed to remove favorite" });
      } else {
        return res.status(200).json({
          error: false,
          message: "favorite successfully removed",
          data,
        });
      }
    });
  }
);

// New Meal Plan
router.post("/newmealplan/post", async (req, res) => {
  const mealPlan = req.body.mealPlan;
  const userId = req.body.userId;

  console.log({ mealPlan, userId });

  await createAndSaveMealPlan({ mealPlan, userId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "meal plan succesfully created", data });
  });
});

// Update Meal Plan
router.put("/updatemealplan/put", async (req, res) => {
  const recipe = req.body.recipe;
  const index = req.body.index;
  const mealPlanId = req.body.mealPlanId;

  console.log("MEALPLANID: ", mealPlanId);

  await updateMealPlan({ recipe, index, mealPlanId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "meal plan succesfully updated", data });
  });
});

// Get Meal Plan
router.get("/getmealplan/get/:id", async (req, res) => {
  // console.log("param: ", req.params.id);
  await findMealPlanById(req.params.id, (err, data) => {
    // console.log("find mealPlan: ", data.plan);
    if (err) {
      return res.json({ error: true, message: "failed to get mealPlan info" });
    } else {
      return res.status(200).json(data);
    }
  });
});

// Delete Meal Plan
router.delete("/deletemealplan/delete/:id&:userId", async (req, res) => {
  console.log("param: ", req.params);
  const mealPlanId = req.params.id;
  const userId = req.params.userId;
  await removeMealPlanById(mealPlanId, userId, (err, data) => {
    console.log(data);
    if (err) {
      return res.json({ error: true, message: "failed to get mealPlan info" });
    } else {
      return res
        .status(200)
        .json({ error: false, message: "meal plan succesfully deleted", data });
    }
  });
});

// Archive Meal Plan

// New List
router.post("/newlist/post", async (req, res) => {
  const list = req.body.list;
  const userId = req.body.userId;
  const mealPlanId = req.body.mealPlanId;
  // console.log(list, userId, mealPlanId);

  await createAndSaveList({ list, userId, mealPlanId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "list succesfully created", data });
  });
});

// Get List
router.get("/getlist/get/:id", async (req, res) => {
  // console.log("param: ", req.params.id);
  await findListById(req.params.id, (err, data) => {
    // console.log("find mealPlan: ", data.plan);
    if (err) {
      return res.json({ error: true, message: "failed to get list info" });
    } else {
      return res.status(200).json(data);
    }
  });
});

// Update List
router.put("/updatelist/put", async (req, res) => {
  const acquiredList = req.body.acquiredList;
  const listList = req.body.listList;
  const listId = req.body.listId;

  console.log("LISTID: ", listId);

  await updateList({ acquiredList, listList, listId }, (err, data) => {
    if (err) return res.status(400).json({ error: true, message: err.message });

    res
      .status(200)
      .json({ error: false, message: "list succesfully updated", data });
  });
});

//Update by ID Method
router.patch("/update/:id", (req, res) => {
  res.send("Update by ID API");
});

//Delete by ID Method
router.delete("/delete/:id", (req, res) => {
  res.send("Delete by ID API");
});

module.exports = router;
