const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Đã kết nối MongoDB thành công!"))
  .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

// Route kiểm tra server
app.get("/", (req, res) => {
  res.send("API Quản lý dinh dưỡng đang hoạt động!");
});

// Routes
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const healthRoutes = require("./routes/health.routes");
const goalRoutes = require("./routes/goal.routes");
const adminUserRoutes = require("./routes/admin/user.admin.routes");
const adminFoodRoutes = require("./routes/admin/food.admin.routes");
const adminRecipeRoutes = require("./routes/admin/recipe.admin.routes");
const adminMealPlanTemplateRoutes = require("./routes/admin/meal_plan_template.admin.routes");
const adminReportRoutes = require("./routes/admin/report.admin.routes");
const adminUnidentifiedFoodRoutes = require("./routes/admin/unidentified_food.admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/foods", adminFoodRoutes);
app.use("/api/admin/recipes", adminRecipeRoutes);
app.use("/api/admin/meal-plan-templates", adminMealPlanTemplateRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/unidentified-foods", adminUnidentifiedFoodRoutes);

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
