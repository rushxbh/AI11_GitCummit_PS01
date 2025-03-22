import 'package:firebase_core/firebase_core.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'firebase_options.dart';

class GeminiService {
  final String apiKey = 'AIzaSyCB0bzFM4JelX-TltDYCSwRmXrfiLKeYjU';

  Future<void> initialize() async {
    if (apiKey == null) {
      print('No API_KEY environment variable');
    }

    // Initialize Firebase
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  Future<String> generateStory(String prompt) async {
    // For text-only input, use the gemini-pro model
    final model = GenerativeModel(model: 'gemini-2.0-flash', apiKey: apiKey);
    final content = Content.text(prompt);
    final response = await model.generateContent([content]);
    return response.text ?? 'No response from Gemini';
  }
}
