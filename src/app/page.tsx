import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Virtual Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your intelligent companion for seamless conversations
          </p>
        </header>
        <Chat />
      </div>
    </div>
  );
}
