const router = require("express").Router();
const { Message } = require("../models");

//add

router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get

router.get("/:conversationId", async (req, res) => {
  const { amountSkip } = req.query;
  const { conversationId } = req.params;
  try {
    const totalMessageCount = await Message.countDocuments({
      conversationId: conversationId,
    });

    const compare =
      totalMessageCount - amountSkip > 0 ? totalMessageCount - amountSkip : 0;

    const messages = await Message.find({
      conversationId: conversationId,
    })
      .populate("employee")
      .skip(compare);

    const lastMessage = await Message.findOne({
      conversationId: conversationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      messages: messages,
      totalMessageCount: messages.length,
      lastMessage: lastMessage,
    });
  } catch (err) {
    console.log(`⚠️⚠️⚠️!! err `, err);
    res.status(500).json(err);
  }
});

module.exports = router;
