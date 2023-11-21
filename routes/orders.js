var ObjectId = require("mongodb").ObjectId;
const axios = require("axios");
const crypto = require("crypto");
const moment = require("moment");
const { Order, Employee, Customer } = require("../models");

const { passportConfig } = require("../middlewares/passport");
var express = require("express");
const passport = require("passport");

var router = express.Router();

var WEBSHOP_URL = process.env.WEB_SHOP_URL || `http://localhost:4444`;

/// GET MUTIPLE
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res, next) => {
    try {
      const {
        orderId,
        customerId,
        methodPay,
        status,
        shippingAddress,
        employee,
        skip,
        limit,
      } = req.query;

      const query = {
        $and: [
          orderId && { _id: orderId },
          customerId && { customerId },
          methodPay && { paymentType: methodPay },
          status && { status },
          shippingAddress && { shippingAddress },
          employee && { employee },
        ].filter(Boolean),
      };

      let results = await Order.find(query)
        .skip(Number(skip))
        .limit(Number(limit))
        .populate({
          path: "orderDetails.product",
          populate: { path: "category" },
        })
        .populate("customer")
        .populate("employee");

      let amountResults = await Order.countDocuments(query);

      res.json({ results, amountResults });
    } catch (error) {
      res.status(500).json({ ok: false, error });
    }
  }
);

// GET

// router.get("/", function (req, res, next) {
//   try {
//     Order.find()
//       .populate({
//         path: "orderDetails.product",
//         populate: { path: "category" },
//       })
//       .populate("customer")
//       .populate("employee")
//       .then((result) => {
//         res.send(result);
//       })
//       .catch((err) => {
//         res.status(400).send({ message: err.message });
//       });
//   } catch (err) {
//     res.sendStatus(500);
//   }
// });

// GET PERSONAL ORDERS
router.get(
  "/personal/:id",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
      if (!objectId) {
        return res.status(400).send({ message: "Invalid customer ID" });
      }
      const query = { customerId: objectId };
      const order = await Order.find(query)
        .populate({
          path: "orderDetails.product",
          populate: { path: "category" },
        })
        .populate("customer")
        .populate("employee");

      if (!order) {
        return res.status(404).send({ message: "Order not found" });
      }

      let amountResults = await Order.countDocuments(query);

      res.send({ results: order, amountResults: amountResults });
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  }
);

// GET/:id
router.get("/:id", function (req, res, next) {
  try {
    const { id } = req.params;
    Order.findById(id)
      .populate({
        path: "orderDetails.product",
        populate: { path: "category" },
      })
      .populate("customer")
      .populate("employee")
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

// POST
router.post("/", function (req, res, next) {
  try {
    const data = req.body;

    const newItem = new Order(data);
    newItem
      .save()
      .then((result) => {
        res.send({ oke: true, result: result });
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

// PATCH/:id
router.patch("/:id", function (req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    Order.findByIdAndUpdate(id, data, {
      new: true,
    })
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

// DELETE
router.delete("/:id", function (req, res, next) {
  try {
    const { id } = req.params;
    Order.findByIdAndDelete(id)
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

// ------------------------------------------------------------------------------------------------
// QUESTIONS 7
// ------------------------------------------------------------------------------------------------
router.get("/questions/7", function (req, res, next) {
  try {
    const { status } = req.query;
    Order.find(
      { status: status },
      {
        createdDate: 1,
        status: 1,
        paymentType: 1,
        orderDetails: 1,
        customerId: 1,
        employeeId: 1,
      }
    )
      .populate({
        path: "orderDetails.product",
        select: { name: 1, price: 1, discount: 1, stock: 1 },
      })
      .populate({ path: "customer", select: "firstName lastName" })
      .populate({ path: "employee", select: "firstName lastName" })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
// ------------------------------------------------------------------------------------------------
// QUESTIONS 8
// ------------------------------------------------------------------------------------------------
router.get("/questions/8", async (req, res, next) => {
  try {
    const { status, date } = req.query;

    const fromDate = new Date(date);
    const toDate = new Date(new Date(date).setDate(fromDate.getDate() + 1));

    // console.log('fromDate', fromDate);
    // console.log('toDate', toDate);

    const compareStatus = { $eq: ["$status", status] };
    const compareFromDate = { $gte: ["$createdDate", fromDate] };
    const compareToDate = { $lt: ["$createdDate", toDate] };

    await Order.aggregate([
      {
        $match: {
          $expr: { $and: [compareStatus, compareFromDate, compareToDate] },
        },
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
            select: { name: 0, price: 1, discount: 1 },
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

// ------------------------------------------------------------------------------------------------
// QUESTIONS 8B
// ------------------------------------------------------------------------------------------------
router.get("/questions/8b", async (req, res, next) => {
  try {
    let { status, fromDate, toDate } = req.query;

    fromDate = new Date(fromDate);

    const tmpToDate = new Date(toDate);

    toDate = new Date(tmpToDate.setDate(tmpToDate.getDate() + 1));

    // console.log('fromDate', fromDate);
    // console.log('toDate', toDate);

    const compareStatus = { $eq: ["$status", status] };
    const compareFromDate = { $gte: ["$createdDate", fromDate] };
    const compareToDate = { $lt: ["$createdDate", toDate] };

    await Order.aggregate([
      {
        $match: {
          $expr: { $and: [compareStatus, compareFromDate, compareToDate] },
        },
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
            select: { name: 1, price: 1, discount: 1 },
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

/// THANH TOAN MOMO
function execPostRequest(url, data) {
  return axios
    .post(url, data, {
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(data)).toString(),
      },
      timeout: 5000,
      timeoutErrorMessage: "Request timeout",
    })
    .then((response) => response.data);
}
router.post("/pay/create_momo_url", (req, res) => {
  console.log("««««« req »»»»»", req.body);
  const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

  const partnerCode = "MOMOBKUN20180529";
  const accessKey = "klm05TvNBzhg7h7j";
  const secretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
  const orderInfo = "Thanh toán qua MoMo";
  const amount = req.body.amount;
  const orderId = `${Date.now()}`;
  const redirectUrl = `${WEBSHOP_URL}/success-payment`;
  const ipnUrl = `${WEBSHOP_URL}/success-payment`;
  const extraData = "";

  const requestBody = {
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: `${Date.now()}`,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    extraData,
    requestType: "payWithATM",
  };

  const rawHash = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestBody.requestId}&requestType=${requestBody.requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawHash)
    .digest("hex");

  requestBody.signature = signature;

  execPostRequest(endpoint, requestBody)
    .then((result) => {
      const payUrl = result.payUrl;
      res.json({ urlPay: payUrl });
    })
    .catch((error) => {
      console.log("Request error:", error.message);
      res.status(500).send("Error occurred during payment creation.");
    });
});

// ------------------VNPAY

router.post("/pay/create_vnpay_url", (req, res, next) => {
  console.log("««««« req.body »»»»»", req.body);
  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  const config = require("../config/vnpay/default.json");
  const tmnCode = config.vnp_TmnCode;
  const secretKey = config.vnp_HashSecret;
  const vnpUrl = config.vnp_Url;
  const returnUrl = `${WEBSHOP_URL}/success-payment`;

  const date = moment(); // Use moment to get the current date and time

  const createDate = date.format("YYYYMMDDHHmmss"); // Format the date using moment
  const orderId = date.format("HHmmss"); // Format the time using moment

  const amount = req.body.amount * 100;
  const bankCode = req.body.bankCode;

  let orderInfo = req.body.orderDescription;
  let orderType = req.body.orderType;
  let locale = req.body.language;
  if (!locale || locale === "") {
    locale = "vn";
  }
  const currCode = "VND";
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_BankCode: "NCB",
  };

  const sortedParams = sortObject(vnp_Params);

  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  sortedParams["vnp_SecureHash"] = signed;
  const vnpUrlWithParams =
    vnpUrl + "?" + new URLSearchParams(sortedParams).toString();

  res.send({ urlPay: vnpUrlWithParams });
});

function sortObject(obj) {
  const sortedObj = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObj[key] = obj[key];
    });
  return sortedObj;
}

module.exports = router;

router.get("/vnpay_return", function (req, res, next) {
  let vnp_Params = req.query;

  let secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  let config = require("../config/vnpay/default.json");
  let tmnCode = config.vnp_TmnCode;
  let secretKey = config.vnp_HashSecret;

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.render("success", { code: "97" });
  }
});

router.get("/vnpay_ipn", function (req, res, next) {
  let vnp_Params = req.query;
  let secureHash = vnp_Params["vnp_SecureHash"];

  let orderId = vnp_Params["vnp_TxnRef"];
  let rspCode = vnp_Params["vnp_ResponseCode"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  let config = require("../config/vnpay/default.json");

  let secretKey = config.vnp_HashSecret;
  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  let paymentStatus = "0"; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
  //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
  //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

  let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
  let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
  if (secureHash === signed) {
    //kiểm tra checksum
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus == "0") {
          //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
          if (rspCode == "00") {
            //thanh cong
            //paymentStatus = '1'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
            res.status(200).json({ RspCode: "00", Message: "Success" });
          } else {
            //that bai
            //paymentStatus = '2'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
            res.redirect(`${WEBSHOP_URL}/checkout`);
          }
        } else {
          res.status(200).json({
            RspCode: "02",
            Message: "This order has been updated to the payment status",
          });
        }
      } else {
        res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
      }
    } else {
      res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }
});

router.post("/querydr", function (req, res, next) {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  let date = new Date();

  let config = require("../config/vnpay/default.json");
  let crypto = require("crypto");

  let vnp_TmnCode = config.vnp_TmnCode;
  let secretKey = config.vnp_HashSecret;
  let vnp_Api = config.vnp_Api;

  let vnp_TxnRef = req.body.orderId;
  let vnp_TransactionDate = req.body.transDate;

  let vnp_RequestId = moment(date).format("HHmmss");
  let vnp_Version = "2.1.0";
  let vnp_Command = "querydr";
  let vnp_OrderInfo = "Truy van GD ma:" + vnp_TxnRef;

  let vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let currCode = "VND";
  let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  let data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnp_TmnCode +
    "|" +
    vnp_TxnRef +
    "|" +
    vnp_TransactionDate +
    "|" +
    vnp_CreateDate +
    "|" +
    vnp_IpAddr +
    "|" +
    vnp_OrderInfo;

  let hmac = crypto.createHmac("sha512", secretKey);
  let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

  let dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnp_TmnCode,
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: vnp_IpAddr,
    vnp_SecureHash: vnp_SecureHash,
  };
  // /merchant_webapi/api/transaction
  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: dataObj,
    },
    function (error, response, body) {
      console.log(response);
    }
  );
});

router.post("/refund", function (req, res, next) {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  let date = new Date();

  let config = require("../config/vnpay/default.json");
  let crypto = require("crypto");

  let vnp_TmnCode = config.vnp_TmnCode;
  let secretKey = config.vnp_HashSecret;
  let vnp_Api = config.vnp_Api;

  let vnp_TxnRef = req.body.orderId;
  let vnp_TransactionDate = req.body.transDate;
  let vnp_Amount = req.body.amount * 100;
  let vnp_TransactionType = req.body.transType;
  let vnp_CreateBy = req.body.user;

  let currCode = "VND";

  let vnp_RequestId = moment(date).format("HHmmss");
  let vnp_Version = "2.1.0";
  let vnp_Command = "refund";
  let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

  let vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  let vnp_TransactionNo = "0";

  let data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnp_TmnCode +
    "|" +
    vnp_TransactionType +
    "|" +
    vnp_TxnRef +
    "|" +
    vnp_Amount +
    "|" +
    vnp_TransactionNo +
    "|" +
    vnp_TransactionDate +
    "|" +
    vnp_CreateBy +
    "|" +
    vnp_CreateDate +
    "|" +
    vnp_IpAddr +
    "|" +
    vnp_OrderInfo;
  let hmac = crypto.createHmac("sha512", secretKey);
  let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

  let dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnp_TmnCode,
    vnp_TransactionType: vnp_TransactionType,
    vnp_TxnRef: vnp_TxnRef,
    vnp_Amount: vnp_Amount,
    vnp_TransactionNo: vnp_TransactionNo,
    vnp_CreateBy: vnp_CreateBy,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: vnp_IpAddr,
    vnp_SecureHash: vnp_SecureHash,
  };

  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: dataObj,
    },
    function (error, response, body) {
      console.log(response);
    }
  );
});

module.exports = router;
