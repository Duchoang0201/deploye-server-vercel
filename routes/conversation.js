const router = require("express").Router();
const { Conversation } = require("../models");
const { Employee } = require("../models");
const mongoose = require("mongoose");

//new conv

router.post("/", async (req, res) => {
  const senderId = req.body.senderId;
  const receiverId = req.body.receiverId;

  try {
    // Check if conversation with the same members already exists
    const existingConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      return res.status(400).json({ error: "Conversation already exists." });
    }

    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });

    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get conv of a user

// router.get("/:userId", async (req, res) => {
//   try {
//     const conversation = await Conversation.find({
//       members: { $in: [req.params.userId] },
//     });

//     res.status(200).json(conversation);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// router.get("/:userId", async (req, res) => {
//   try {
//     const conversation = await Conversation.find({
//       members: { $in: [req.params.userId] },
//     });

//     const memberIds = conversation.flatMap((conv) => conv.members);

//     const employees = await Employee.find({
//       _id: { $in: memberIds },
//     });

//     const result = conversation.map((conv) => {
//       const employeeInfo = employees
//         .filter((emp) => conv.members.includes(emp._id.toString()))
//         .map((emp) => ({
//           employeeId: emp._id,
//           employeeName: emp.name,
//           // Add other employee information you want to include
//         }))
//         .filter((emp) => emp.employeeId.toString() !== req.params.userId);

//       return {
//         conversationId: conv._id,
//         employeeInfo: employeeInfo,
//       };
//     });

//     res.status(200).json(result);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// router.post("/:userId", async (req, res) => {
//   const userId = new mongoose.Types.ObjectId(req.params.userId);

//   try {
//     const results = await Conversation.aggregate([
//       {
//         $match: {
//           members: userId,
//         },
//       },
//       {
//         $unwind: "$members",
//       },
//       {
//         $redact: {
//           $cond: {
//             if: { $eq: ["$members", userId] },
//             then: "$$PRUNE",
//             else: "$$KEEP",
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "employees", // Replace with the actual name of the employee collection
//           localField: "members",
//           foreignField: "_id",
//           as: "employeeInfo",
//         },
//       },
//       {
//         $lookup: {
//           from: "messages", // Replace with the actual name of the employee collection
//           localField: "_id",
//           foreignField: "conversationId",
//           as: "lastMessage",
//         },
//       },
//       {
//         $project: {
//           conversationId: "$_id",
//           employeeInfo: {
//             $map: {
//               input: "$employeeInfo",
//               as: "emp",
//               in: {
//                 _id: "$$emp._id",
//                 firstName: "$$emp.firstName",
//                 lastName: "$$emp.lastName",
//                 isActive: "$$emp.isActive",
//               },
//             },
//           },
//           lastMessage: "$lastMessage",
//         },
//       },
//     ]);

//     res.status(200).json(results);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
router.post("/:userId", async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.params.userId);

  try {
    const results = await Conversation.aggregate([
      {
        $match: {
          members: userId,
        },
      },
      {
        $unwind: "$members",
      },
      {
        $redact: {
          $cond: {
            if: { $eq: ["$members", userId] },
            then: "$$PRUNE",
            else: "$$KEEP",
          },
        },
      },
      {
        $lookup: {
          from: "employees", // Replace with the actual name of the employee collection
          localField: "members",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      {
        $lookup: {
          from: "messages", // Replace with the actual name of the message collection
          let: { conversationId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$conversationId", "$$conversationId"],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "lastMessage",
        },
      },
      {
        $unwind: {
          path: "$lastMessage",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          conversationId: "$_id",
          employeeInfo: {
            $map: {
              input: "$employeeInfo",
              as: "emp",
              in: {
                _id: "$$emp._id",
                firstName: "$$emp.firstName",
                lastName: "$$emp.lastName",
                isActive: "$$emp.isActive",
                imageUrl: "$$emp.imageUrl",
              },
            },
          },
          lastMessage: {
            _id: "$lastMessage._id",
            conversationId: "$lastMessage.conversationId",
            sender: "$lastMessage.sender",
            text: "$lastMessage.text",
            createdAt: "$lastMessage.createdAt",
            updatedAt: "$lastMessage.updatedAt",
            __v: "$lastMessage.__v",
          },
        },
      },
      { $unwind: "$employeeInfo" },
    ]);

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get conv includes two userId

router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
