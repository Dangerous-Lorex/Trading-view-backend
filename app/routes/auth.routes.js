const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const bodyparser = require("body-parser");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.use(bodyparser.json());
  app.use(
      bodyparser.urlencoded({
          extended: true,
      })
  );

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail
      // verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);
  app.post("/api/auth/googleSignin", controller.googleSignin);
  app.post("/api/auth/googleSignup", controller.googleSignup);
  app.get("/api/getOrganizations", controller.getallorgs);
  app.post("/api/auth/forgot-password", controller.forgotpassword);
  app.post("/api/auth/reset-password", controller.resetpassword);
};
