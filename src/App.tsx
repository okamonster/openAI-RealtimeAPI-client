import { useRef, useState } from "react";
import "./App.css";

function App() {
	const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
	const audioElementRef = useRef<HTMLAudioElement>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

	const startSession = async () => {
		const tokenResponse = await fetch("http://localhost:8787/session", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await tokenResponse.json();
		const EPHEMERAL_KEY = data.client_secret.value;

		const peerConnection = new RTCPeerConnection();

		audioElementRef.current = document.createElement("audio");
		audioElementRef.current.autoplay = true;
		peerConnection.ontrack = (e) => {
			if (!audioElementRef.current) {
				return;
			}
			audioElementRef.current.srcObject = e.streams[0];
		};

		const mediaStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		peerConnection.addTrack(mediaStream.getTracks()[0]);

		setDataChannel(peerConnection.createDataChannel("oai-event"));

		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);

		const sdpResponse = await fetch("https://api.openai.com/v1/realtime", {
			method: "POST",
			body: offer.sdp,
			headers: {
				Authorization: `Bearer ${EPHEMERAL_KEY}`,
				"Content-Type": "application/sdp",
			},
		});

		const answer: RTCSessionDescriptionInit = {
			type: "answer",
			sdp: await sdpResponse.text(),
		};

		await peerConnection.setRemoteDescription(answer);

		peerConnectionRef.current = peerConnection;
	};

	const endSession = () => {
		if (dataChannel) {
			dataChannel.close();
		}

		if (peerConnectionRef.current) {
			for (const sender of peerConnectionRef.current.getSenders()) {
				if (sender.track) {
					sender.track.stop();
				}
			}

			peerConnectionRef.current.close();
		}

		setDataChannel(null);
		peerConnectionRef.current = null;
	};
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
