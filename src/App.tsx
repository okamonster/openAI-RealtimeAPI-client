import "./App.css";
import { useRealtimeApiSession } from "./hooks/useRealtimeApiSession";

function App() {
	const { startSession, endSession } = useRealtimeApiSession();

	return (
		<div className="app">
			<h1>WebRTC 電話クライアント</h1>
			<button type="button" onClick={startSession}>
				接続
			</button>
			<button type="button" onClick={endSession}>
				切断
			</button>
		</div>
	);
}

export default App;
