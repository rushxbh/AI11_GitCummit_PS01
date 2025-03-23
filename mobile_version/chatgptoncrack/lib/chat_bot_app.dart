import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'gemini_service.dart';

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with TickerProviderStateMixin {
  final List<ChatMessage> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  void _handleSubmitted(String text) {
    if (text.trim().isEmpty) return;
    _textController.clear();
    ChatMessage message = ChatMessage(
      text: text,
      isUser: true,
      animationController: AnimationController(
        duration: Duration(milliseconds: 300),
        vsync: this,
      ),
    );
    setState(() {
      _messages.insert(0, message);
    });
    message.animationController.forward();
    _getBotResponse(text);
  }

  Future<void> _getBotResponse(String text) async {
    const prompt =
        'You are a professional trading AI. Provide clear, definitive, and precise answers to trading-related queries only. Keep responses concise and actionable. User\'s question: "{input}"';
    final formattedPrompt = prompt.replaceFirst('{input}', text);
    String response = await GeminiService().generateStory(formattedPrompt);

    ChatMessage botMessage = ChatMessage(
      text: response,
      isUser: false,
      animationController: AnimationController(
        duration: Duration(milliseconds: 300),
        vsync: this,
      ),
    );
    setState(() {
      _messages.insert(0, botMessage);
    });
    botMessage.animationController.forward();
  }

  @override
  void dispose() {
    for (var message in _messages) {
      message.animationController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('TradeBot AI'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              Navigator.of(context).pushReplacementNamed('/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              padding: EdgeInsets.all(12),
              controller: _scrollController,
              itemCount: _messages.length,
              itemBuilder: (_, index) => _messages[index],
            ),
          ),
          Divider(height: 1),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(color: Theme.of(context).cardColor),
            child: _buildTextComposer(),
          ),
        ],
      ),
    );
  }

  Widget _buildTextComposer() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _textController,
            decoration: InputDecoration(
              hintText: "Type your message...",
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            ),
          ),
        ),
        IconButton(
          icon: Icon(Icons.send, color: Theme.of(context).primaryColor),
          onPressed: () => _handleSubmitted(_textController.text),
        ),
      ],
    );
  }
}

class ChatMessage extends StatelessWidget {
  final String text;
  final bool isUser;
  final AnimationController animationController;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.animationController,
  });

  @override
  Widget build(BuildContext context) {
    final messageAlignment =
        isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final messageColor =
        isUser ? Theme.of(context).primaryColor : Colors.grey[300];
    final textColor = isUser ? Colors.white : Colors.black;

    return SizeTransition(
      sizeFactor: CurvedAnimation(
        parent: animationController,
        curve: Curves.easeOut,
      ),
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment:
              isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            if (!isUser) CircleAvatar(child: Text('B')),
            SizedBox(width: 8),
            Flexible(
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: messageColor,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(text, style: TextStyle(color: textColor)),
              ),
            ),
            if (isUser) SizedBox(width: 8),
            if (isUser) CircleAvatar(child: Text('U')),
          ],
        ),
      ),
    );
  }
}
