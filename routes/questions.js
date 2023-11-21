const express = require("express");
const router = express.Router();

const {
  Category,
  Customer,
  Employee,
  Product,
  Supplier,
  Order,
} = require("../models");
const { getQueryDateTime } = require("../helpers/util");

//Get data with discount <= 5%

router.get("/1", function (req, res, next) {
  try {
    let discount = req.query.discount;
    let query = { discount: { $lte: discount } };
    Product.find(query)
      .select("discount")
      .populate("category")
      .populate("supplier")
      .lean({ virtuals: false })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});
//Get data with discount <= 5%

router.get("/1b", function (req, res, next) {
  try {
    const discount = req.query.discount;
    const query = { discount: { $lte: discount } };

    Product.find(query)
      .populate("category")
      .populate("supplier")
      .then((res) => {
        res.send({ res });
      })
      .catch((err) => {
        res.status(500).send({ err });
      });
  } catch (error) {
    res.status(400).send({ message: err.message });
  }
});

//Get data with stock <=5
router.get("/2", function (req, res, next) {
  try {
    const stock = req.query.stock;
    const query = { stock: { $lte: stock } };

    Product.find(query)
      .then((data) => res.send({ data }))
      .catch((err) => res.send({ message: err.message }));
  } catch (error) {
    res.status(400).send({ message: err.message });
  }
});

//Get data with discount Price <= 100

router.get("/3", async (req, res, next) => {
  try {
    // let finalPrice = price * (100 - discount) / 100;
    const s = { $subtract: [100, "$discount"] }; // (100 - 5)
    const m = { $multiply: ["$price", s] }; // price * 95
    const d = { $divide: [m, 100] }; // price * 95 / 100

    const { price } = req.query;

    let query = { $expr: { $lte: [d, parseFloat(price)] } };
    Product.find(query)
      .select("name price discount")
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } catch (error) {
    res.status(500).json(error);
  }
});

//Get data with a specific customer distric in 'address'

router.get("/4", async (req, res, next) => {
  let address = req.query.address;
  console.log(address);
  let query = { address: new RegExp(`${address}`) };

  await Customer.find(query)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => res.send(500).send({ err }));
});

//Get data with a year of birthday customer  is ..
router.get("/5", async (req, res, next) => {
  try {
    const year = req.query.year;

    const query = {
      $expr: {
        $eq: [{ $year: "$birthday" }, year],
      },
    };

    await Customer.find(query)
      .then((data) => res.send(data))
      .catch((err) => res.status(400).send({ message: err }));
  } catch (error) {
    res.status(500).send({ message: error });
  }
});

//get data with birthday is a some date
router.get("/6", async (req, res, next) => {
  try {
    const date = req.query.date;

    const formatDate = new Date(date);

    //Cach 1

    const eqDay = {
      $eq: [{ $dayOfMonth: "$birthday" }, { $dayOfMonth: formatDate }],
    };
    const eqMonth = {
      $eq: [{ $month: "$birthday" }, { $month: formatDate }],
    };
    const query = {
      $expr: { $and: [eqDay, eqMonth] },
    };
    //Cach 2

    const query2 = {
      $expr: {
        $and: [
          { $eq: [{ $dayOfMonth: "$birthday" }, { $dayOfMonth: formatDate }] },
          { $eq: [{ $month: "$birthday" }, { $month: formatDate }] },
        ],
      },
    };

    await Customer.find(query2)
      .then((data) => res.send(data))
      .catch((err) => res.status(400).send(err));
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get("/7", async (req, res, next) => {
  try {
    const status = req.query.status;

    //Cach 1
    let query1 = {
      status: { $eq: status },
    };

    //Cach 2
    const query2 = {
      $expr: {
        $eq: ["$status", status],
      },
    };
    await Order.find(query1)
      .populate({
        path: "orderDetails.product",
        select: { name: 1, price: 1, discount: 1, stock: 1 },
      })
      .populate({ path: "customer", select: "firstName lastName" })
      .populate("employee")
      .then((data) => res.send(data))
      .catch((err) => res.status(400).send(err));
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get("/8", async (req, res, next) => {
  try {
    const status = req.query.status;
    console.log(status);

    let fromDate = new Date(req.query.fromDate);
    fromDate.setHours(0, 0, 0, 0);

    console.log(fromDate);

    let tempToDate = new Date(req.query.toDate);
    toDate = new Date(tempToDate.setDate(tempToDate.getDate() + 1));
    toDate.setHours(0, 0, 0, 0);

    console.log(toDate);

    const query = {
      $expr: {
        $and: [
          { $eq: ["$status", status] },
          { $gte: ["$createdDate", fromDate] },
          { $lte: ["$createdDate", toDate] },
        ],
      },
    };
    await Order.aggregate([
      {
        $match: query,
      },
    ])
      .project({
        _id: 1,
        status: 1,
        paymentType: 1,
        createdDate: 1,
        orderDetails: 1,
        employeeId: 1,
        customerId: 1,
      })
      .then((result) => {
        // res.send(result);
        // POPULATE
        Order.populate(result, [
          { path: "employee" },
          { path: "customer" },
          {
            path: "orderDetails.product",
          },
        ])
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            res.status(400).send({ message: err.message });
          });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

router.get("/13", async (req, res, next) => {
  try {
    let addressDelivery = req.query.address;
    console.log(addressDelivery);

    // const option = [
    //   {
    //     `${address}`: new RegExp(`${addressDelivery}`),
    //   },
    // ];
    // let query = { address: new RegExp(`${address}`) };

    await Order.aggregate()
      .lookup({
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      })
      .unwind("customer")
      // .match({
      //   "customer.address": new RegExp(`${addressDelivery}`),
      // })
      .project({ customerId: 0 })

      .then((result) => {
        res.send({
          total: result.length,
          payload: result,
        });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.sendStatus(500);
  }
});

router.get("/14", async (req, res, next) => {
  try {
    let kind = req.query.kind;

    let birthday = new Date(req.query.birthday);

    const compareDay = {
      $eq: [{ $dayOfMonth: "$birthday" }, { $dayOfMonth: birthday }],
    };

    const compareMonth = {
      $eq: [{ $month: "$birthday" }, { $month: birthday }],
    };

    const query = {
      $expr: {
        $and: [compareDay, compareMonth],
      },
    };
    Customer.find(query)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.sendStatus(500);
  }
});

router.get("/15", async (req, res, next) => {
  try {
    const supplierNames = req.query.supplierNames;
    let query = {
      name: { $in: supplierNames },
    };

    Supplier.find(query)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/16", async (req, res, next) => {
  try {
    await Order.aggregate()
      .lookup({
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      })
      .project({
        orderDetails: 1,
        customer: 1,
      })
      .unwind("customer")
      .project({
        orderDetails: "$orderDetails",
        _id: "$customer._id",
        firstName: "$customer.firstName",
        lastName: "$customer.lastName",
        address: "$customer.address",
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/17", async (req, res, next) => {
  try {
    await Product.aggregate()
      .lookup({
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      })
      .lookup({
        from: "suppliers",
        localField: "supplierId",
        foreignField: "_id",
        as: "supplier",
      })
      .unwind("category", "supplier")
      .project({
        productName: "$name",
        price: "$price",
        category: "$category.description",
        supplier: "$supplier.name",
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/18", async (req, res, next) => {
  // await Category.aggregate()
  //   .lookup({
  //     from: "products",
  //     localField: "_id",
  //     foreignField: "categoryId",
  //     as: "products",
  //   })
  //   .project({
  //     _id: 0,
  //     name: 1,
  //     products: 1,
  //   })
  //   .then((result) => {
  //     res.send(result);
  //   })
  //   .catch((err) => {
  //     res.status(400).send({ message: err.message });
  //   });

  try {
    const aggregate = [
      {
        $lookup: {
          from: "products",
          let: { id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$id", "$categoryId"] },
                active: true, // Add the condition here
              },
            },
          ],
          as: "products",
        },
      },
      {
        $addFields: { numberOfProducts: { $sum: "$products.stock" } },
      },
    ];

    Category.aggregate(aggregate)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        numberOfProducts: 1,
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/19", async (req, res, next) => {
  try {
    const aggregate = [
      {
        $lookup: {
          from: "products",
          let: { id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$id", "$supplierId"] },
                active: true, // Add the condition here
              },
            },
          ],
          as: "products",
        },
      },
      {
        $addFields: { numberOfProducts: { $sum: "$products.stock" } },
      },
    ];
    Supplier.aggregate(aggregate)

      .project({
        _id: 1,
        name: 1,
        description: 1,
        numberOfProducts: 1,
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/19a", async (req, res, next) => {
  await Supplier.aggregate()
    .lookup({
      from: "products",
      localField: "_id",
      foreignField: "supplierId",
      as: "products",
    })
    .project({
      _id: 0,
      name: 1,
      products: 1,
    })

    // .project({
    //   categoryName: "$name",
    //   products: "$products",
    // })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(400).send({ message: err.message });
    });
});

router.get("/20", async (req, res, next) => {
  let { fromDate, toDate } = req.query;

  fromDate = new Date(fromDate);
  let tmpToDate = new Date(toDate);
  toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

  console.log(fromDate, toDate);

  const compareFromDate = { $gte: ["$createdDate", fromDate] };
  const compareToDate = { $lt: ["$createdDate", toDate] };
  const query = { $expr: { $and: [compareFromDate, compareToDate] } };
  await Order.aggregate()
    .match(query)
    .unwind("orderDetails")
    .lookup({
      from: "products",
      localField: "orderDetails.productId",
      foreignField: "_id",
      as: "productTODAY",
    })
    .unwind("productTODAY")
    .group({
      _id: "$productTODAY._id",
      name: { $first: "$productTODAY.name" },
      price: { $first: "$productTODAY.price" },
      categoryId: { $first: "$productTODAY.categoryId" },
      employeeId: { $first: "$employeeId" },
    })

    .then((data) => res.send({ data: data, length: data.length }))
    .catch((err) => res.status(400).send(err));
});

router.get("/21", async (req, res, next) => {
  let { fromDate, toDate } = req.query;

  fromDate = new Date(fromDate);

  let tmpToDate = new Date(toDate);
  toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

  const compareFromDate = { $gte: ["$createdDate", fromDate] };
  const compareToDate = { $lt: ["$createdDate", toDate] };
  const query = { $expr: { $and: [compareFromDate, compareToDate] } };

  Order.aggregate()
    .lookup({
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer",
    })
    .match(query)
    .unwind({
      path: "$customer",
      preserveNullAndEmptyArrays: true,
    })
    .unwind({
      path: "$orderDetails",
      preserveNullAndEmptyArrays: true,
    })
    .project({
      customerId: "$customerId",
      orderDetails: "$orderDetails",
      customer: "$customer",
    })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(400).send({ message: err.message });
    });
});

// router.get("/22", async (req, res, next) => {
//   let { fromDate, toDate } = req.query;

//   fromDate = new Date(fromDate);

//   let tmpToDate = new Date(toDate);
//   toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

//   console.log(fromDate, toDate);
//   const compareFromDate = { $gte: ["$createdDate", fromDate] };
//   const compareToDate = { $lt: ["$createdDate", toDate] };
//   const query = { $expr: { $and: [compareFromDate, compareToDate] } };

//   Order.aggregate()
//     .lookup({
//       from: "customers",
//       localField: "customerId",
//       foreignField: "_id",
//       as: "customer",
//     })
//     .match(query)
//     .unwind({
//       path: "$customer",
//       preserveNullAndEmptyArrays: true,
//     })

//     .project({
//       customerId: "$customerId",
//       orderDetails: "$orderDetails",
//       customer: "$customer",
//       total: "$orderDetails.price",
//     })
//     .then((result) => {
//       res.send({ length: result.length, result: result });
//     })
//     .catch((err) => {
//       res.status(400).send({ message: err.message });
//     });
// });

router.get("/22", function (req, res, next) {
  try {
    let { fromDate, toDate } = req.query;

    fromDate = new Date(fromDate);

    const tmpToDate = new Date(toDate);
    toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

    const compareFromDate = { $gte: ["$createdDate", fromDate] };
    const compareToDate = { $lt: ["$createdDate", toDate] };

    const query = {
      $expr: { $and: [compareFromDate, compareToDate] },
    };

    Order.aggregate()
      .lookup({
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      })
      .match(query)
      .unwind("customer")
      .unwind("orderDetails")
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "orderDetails.product",
      })
      .unwind("orderDetails.product")
      .addFields({
        "orderDetails.name": "$orderDetails.product.name",
        "orderDetails.discount": "$orderDetails.product.discount",
        "orderDetails.price": "$orderDetails.product.price",
      })
      .project({
        // Optionally, you can remove the "orderDetails.product" field from the result
        // if you don't need it anymore after adding its properties to "orderDetails".
        "orderDetails.product": 0,
      })
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .group({
        _id: "$customer._id",
        firstName: { $first: "$customer.firstName" },
        lastName: { $first: "$customer.lastName" },
        email: { $first: "$customer.email" },
        phoneNumber: { $first: "$customer.phoneNumber" },
        address: { $first: "$customer.address" },
        birthday: { $first: "$customer.birthday" },
        total_sales: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/23", function (req, res, next) {
  try {
    // const s = { $subtract: [100, '$orderDetails.discount'] };

    // const m = { $multiply: ['$orderDetails.price', s] };

    // const d = { $divide: [m, 100] };

    Order.aggregate()
      .unwind("orderDetails")
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "product",
      })
      .addFields({
        "orderDetails.price": { $arrayElemAt: ["$product.price", 0] },
        "orderDetails.discount": { $arrayElemAt: ["$product.discount", 0] },
      })
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .addFields({
        totalPay: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .project({
        product: 0,
      })
      .then((result) => {
        res.send({
          result: result,
          total: result
            .map((item) => item.totalPay)
            .reduce((total, current) => total + current, 0),
        });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.post("/23b", function (req, res, next) {
  const { year } = req.body;
  try {
    Order.aggregate([
      {
        $match: {
          createdDate: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $unwind: "$orderDetails",
      },
      {
        $lookup: {
          from: "products",
          localField: "orderDetails.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $addFields: {
          "orderDetails.price": { $arrayElemAt: ["$product.price", 0] },
          "orderDetails.discount": { $arrayElemAt: ["$product.discount", 0] },
        },
      },
      {
        $addFields: {
          originalPrice: {
            $divide: [
              {
                $multiply: [
                  "$orderDetails.price",
                  { $subtract: [100, "$orderDetails.discount"] },
                ],
              },
              100,
            ],
          },
        },
      },
      {
        $addFields: {
          totalPay: {
            $multiply: ["$originalPrice", "$orderDetails.quantity"],
          },
          month: {
            $dateToString: {
              format: "%m",
              date: { $toDate: "$createdDate" },
            },
          },
        },
      },
      {
        $group: {
          _id: "$month",
          orders: {
            $push: {
              orderId: "$_id",
              customerId: "$customerId",
              createdDate: "$createdDate",
              orderDetails: "$orderDetails",
              originalPrice: "$originalPrice",
              totalPay: "$totalPay",
            },
          },
          revenue: {
            $sum: "$totalPay",
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: { $toInt: "$_id" },
          orders: 1,
          revenue: 1,
        },
      },
      {
        $sort: {
          month: 1,
        },
      },
    ])
      .then((result) => {
        const orderList = [];
        for (let i = 1; i <= 12; i++) {
          const monthData = result.find((item) => item.month === i);
          orderList.push(
            monthData ? monthData : { month: i, orders: [], revenue: 0 }
          );
        }
        res.send(orderList);
      })
      .catch((error) => {
        console.error(error);
        res.sendStatus(500);
      });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/24", function (req, res, next) {
  try {
    Order.aggregate()
      .lookup({
        from: "employees",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee",
      })
      .unwind("employee")
      .unwind("orderDetails")
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "orderDetails.product",
      })
      .unwind("orderDetails.product")
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.product.price",
                {
                  $subtract: [100, "$orderDetails.product.discount"],
                },
              ],
            },
            100,
          ],
        },
      })
      .group({
        _id: "$employee._id",
        firstName: { $first: "$employee.firstName" },
        lastName: { $first: "$employee.lastName" },
        email: { $first: "$employee.email" },
        phoneNumber: { $first: "$employee.phoneNumber" },
        address: { $first: "$employee.address" },
        birthday: { $first: "$employee.birthday" },
        total_sales: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});
router.get("/25", function (req, res, next) {
  try {
    let { fromDate, toDate } = req.query;

    fromDate = new Date(fromDate);

    const tmpToDate = new Date(toDate);
    toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

    const compareFromDate = { $gte: ["$createdDate", fromDate] };
    const compareToDate = { $lt: ["$createdDate", toDate] };

    const query = {
      $expr: { $and: [compareFromDate, compareToDate] },
    };

    // const s = { $subtract: [100, '$orderDetails.discount'] };

    // const m = { $multiply: ['$orderDetails.price', s] };

    // const d = { $divide: [m, 100] };

    Product.aggregate()
      .lookup({
        from: "orders",
        localField: "_id",
        foreignField: "orderDetails.productId",
        as: "orders",
      })
      .match({ orders: { $size: 0 } })
      .project({
        id: 1,
        name: 1,
        price: 1,
        stock: 1,
        categoryId: 1,
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/26", function (req, res, next) {
  try {
    let { fromDate, toDate } = req.query;

    fromDate = new Date(fromDate);

    const tmpToDate = new Date(toDate);
    toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

    const compareFromDate = { $gte: ["$createdDate", fromDate] };
    const compareToDate = { $lt: ["$createdDate", toDate] };

    const query = {
      $expr: { $and: [compareFromDate, compareToDate] },
    };

    // const s = { $subtract: [100, '$orderDetails.discount'] };

    // const m = { $multiply: ['$orderDetails.price', s] };

    // const d = { $divide: [m, 100] };

    Product.aggregate()
      .lookup({
        from: "orders",
        localField: "_id",
        foreignField: "orderDetails.productId",
        as: "orders",
      })
      .unwind({
        path: "$orders",
        preserveNullAndEmptyArrays: true,
      })
      .match({
        $or: [
          {
            $and: [
              { orders: { $ne: null } },
              {
                $or: [
                  { "orders.createdDate": { $lte: fromDate } },
                  { "orders.createdDate": { $gte: toDate } },
                ],
              },
            ],
          },
          {
            orders: null,
          },
        ],
      })
      .lookup({
        from: "suppliers",
        localField: "supplierId",
        foreignField: "_id",
        as: "suppliers",
      })
      .project({
        _id: 0,
        suppliers: 1,
      })
      .unwind({
        path: "$suppliers",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: "$suppliers._id",
        name: "$suppliers.name",
        email: "$suppliers.email",
        phoneNumber: "$suppliers.phoneNumber",
        address: "$suppliers.address",
      })
      .group({
        _id: "$_id",
        name: { $first: "$name" },
        phoneNumber: { $first: "$phoneNumber" },
        email: { $first: "$email" },
        address: { $first: "$address" },
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/26b", async (req, res, next) => {
  try {
    Product.aggregate()
      .lookup({
        from: "orders",
        localField: "_id",
        foreignField: "orderDetails.productId",
        as: "orders",
      })
      .addFields({
        orders: { $size: "$orders" },
      })
      .match({
        orders: { $gt: 0 },
      })
      .lookup({
        from: "suppliers",
        localField: "supplierId",
        foreignField: "_id",
        as: "suppliers",
      })
      .project({
        _id: 0,
        suppliers: 1,
      })
      // .unwind({
      //   path: "$suppliers",
      //   preserveNullAndEmptyArrays: true,
      // })
      // .project({
      //   _id: "$suppliers._id",
      //   name: "$suppliers.name",
      //   email: "$suppliers.email",
      //   phoneNumber: "$suppliers.phoneNumber",
      //   address: "$suppliers.address",
      // })
      // .group({
      //   _id: "$_id",
      //   name: { $first: "$name" },
      //   phoneNumber: { $first: "$phoneNumber" },
      //   email: { $first: "$email" },
      //   address: { $first: "$address" },
      // })

      .then((result) => {
        res.send({
          total: result.length,
          payload: result,
        });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.sendStatus(500);
  }
});

router.get("/27", function (req, res, next) {
  try {
    Order.aggregate()
      .lookup({
        from: "employees",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee",
      })
      .unwind("employee")
      .unwind("orderDetails")
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .group({
        _id: "$employee._id",
        firstName: { $first: "$employee.firstName" },
        lastName: { $first: "$employee.lastName" },
        email: { $first: "$employee.email" },
        phoneNumber: { $first: "$employee.phoneNumber" },
        address: { $first: "$employee.address" },
        birthday: { $first: "$employee.birthday" },
        total_sales: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .sort({ total_sales: 1 })

      .then((result) => {
        res.send({ result: result, thirdOne: result[2] });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});
router.post("/27b", function (req, res, next) {
  const { year } = req.body;
  try {
    Order.aggregate()
      .match({
        createdDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      })
      .unwind("orderDetails")
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "product",
      })
      .addFields({
        "orderDetails.price": { $arrayElemAt: ["$product.price", 0] },
        "orderDetails.discount": { $arrayElemAt: ["$product.discount", 0] },
      })
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .addFields({
        totalPay: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .lookup({
        from: "employees",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee",
      })
      .addFields({
        firstName: { $arrayElemAt: ["$employee.firstName", 0] },
        lastName: { $arrayElemAt: ["$employee.lastName", 0] },
      })
      //The "month" field is derived using the $dateToString operator, which converts the "createdDate" field (assumed to be a date or timestamp field) to a string representation of the month.
      //The format option "%m" specifies that only the numeric representation of the month (e.g., "01" for January) should be included in the result. (Chuyển tháng 1 ra 01, January to 01 )
      .addFields({
        month: {
          $dateToString: {
            format: "%m",
            date: { $toDate: "$createdDate" },
          },
        },
      })

      .group({
        _id: "$employeeId",
        firstName: { $first: "$firstName" },
        lastName: { $first: "$lastName" },
        month: { $first: "$month" },
        orders: { $push: "$$ROOT" },
        total: { $sum: "$totalPay" },
      })
      .then((result) => {
        res.send(result);
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/29", function (req, res, next) {
  try {
    let { fromDate, toDate } = req.query;
    const query = getQueryDateTime(fromDate, toDate);

    Product.distinct("discount")

      .then((result) => {
        res.send({
          result: result,
        });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});
router.get("/33", function (req, res, next) {
  try {
    let { fromDate, toDate } = req.query;
    const query = getQueryDateTime(fromDate, toDate);

    // const s = { $subtract: [100, '$orderDetails.discount'] };

    // const m = { $multiply: ['$orderDetails.price', s] };

    // const d = { $divide: [m, 100] };

    Order.aggregate()
      .match(query)
      .unwind("orderDetails")
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .addFields({
        totalPay: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .group({
        _id: "$_id",
        total_sales: {
          $sum: "$totalPay",
        },
      })
      // .group({
      //   _id: "$total_sales",
      //   All: {
      //     $push: "$$ROOT",
      //   },
      // })
      .sort({ _id: 1 })
      .limit(3)
      .skip(0)
      .then((result) => {
        res.send({
          result: result,
          total: result
            .map((item) => item.total_sales)
            .reduce((total, current) => total + current, 0),
        });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/30", async (req, res, next) => {
  try {
    const response = await Category.aggregate()
      .lookup({
        from: "products",
        localField: "_id",
        foreignField: "categoryId",
        as: "products",
      })
      .unwind({
        path: "$products",
        preserveNullAndEmptyArrays: true,
      })
      .lookup({
        from: "orders",
        localField: "products._id",
        foreignField: "orderDetails.productId",
        as: "orders",
      })
      .unwind({
        path: "$orders",
        preserveNullAndEmptyArrays: true,
      })
      .unwind({
        path: "$orders.orderDetails",
        preserveNullAndEmptyArrays: true,
      })
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orders.orderDetails.price",
                { $subtract: [100, "$orders.orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
        amount: "$orders.orderDetails.quantity",
      })
      .group({
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        total: {
          $sum: { $multiply: ["$originalPrice", "$amount"] },
        },
      });

    if (!response) return res.status(400).send({ message: "Not found" });

    res.send(response);
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/30a", function (req, res, next) {
  try {
    Order.aggregate()
      .unwind({
        path: "$orderDetails",
        preserveNullAndEmptyArrays: true,
      })
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .addFields({
        totalPay: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "productCheck",
      })
      .unwind({
        path: "$productCheck",
        preserveNullAndEmptyArrays: true,
      })
      .lookup({
        from: "categories",
        localField: "productCheck.categoryId",
        foreignField: "_id",
        as: "categoriesCheck",
      })
      .unwind({
        path: "$categoriesCheck",
        preserveNullAndEmptyArrays: true,
      })
      .group({
        _id: "$categoriesCheck._id",
        categoryName: { $first: "$categoriesCheck.name" },
        totalCategories: { $sum: "$totalPay" },
      })

      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});
router.get("/34", function (req, res, next) {
  try {
    let { fromDate, toDate } = req.query;
    const query = getQueryDateTime(fromDate, toDate);

    // const s = { $subtract: [100, '$orderDetails.discount'] };

    // const m = { $multiply: ['$orderDetails.price', s] };

    // const d = { $divide: [m, 100] };

    Order.aggregate()
      .match(query)
      .unwind("orderDetails")
      .addFields({
        originalPrice: {
          $divide: [
            {
              $multiply: [
                "$orderDetails.price",
                { $subtract: [100, "$orderDetails.discount"] },
              ],
            },
            100,
          ],
        },
      })
      .addFields({
        totalPay: {
          $sum: { $multiply: ["$originalPrice", "$orderDetails.quantity"] },
        },
      })
      .group({
        _id: null,
        Avarage: {
          $avg: "$totalPay",
        },
      })

      .then((result) => {
        res.send({
          result: result,
          Avarage: result
            .map((item) => item.Avarage)
            .reduce((total, current) => total + current, 0),
        });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

router.get("/sold", async (req, res) => {
  try {
    Order.aggregate()
      .match({ status: "COMPLETED" })
      .unwind("$orderDetails")
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "productSold",
      })
      .unwind("$productSold")
      .group({
        _id: "$productSold._id",
        productName: { $first: "$productSold.name" },
        price: { $first: "$productSold.price" },
        totalQuantity: { $sum: "$orderDetails.quantity" },
      })
      // .project({
      //   _id: 1,
      //   productName: 1,
      //   price: 1,
      //   totalQuantity: 1,
      // })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.sendStatus(500);
  }
});

module.exports = router;
