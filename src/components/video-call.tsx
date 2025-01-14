"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoCallProps {
  roomId: string;
  isAdmin?: boolean;
}

export default function VideoCall({ roomId, isAdmin = false }: VideoCallProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isNegotiatingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = io("http://localhost:3001");

        // Create and configure peer connection first
        const configuration = {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        };
        peerConnectionRef.current = new RTCPeerConnection(configuration);

        // Handle negotiation needed
        peerConnectionRef.current.onnegotiationneeded = async () => {
          try {
            if (
              isAdmin &&
              !isNegotiatingRef.current &&
              peerConnectionRef.current
            ) {
              isNegotiatingRef.current = true;
              await peerConnectionRef.current.setLocalDescription();
              socketRef.current?.emit("offer", {
                roomId,
                offer: peerConnectionRef.current.localDescription,
              });
            }
          } catch (err) {
            console.error("Error during negotiation:", err);
          } finally {
            isNegotiatingRef.current = false;
          }
        };

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks in a consistent order: audio first, then video
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        if (audioTrack) {
          peerConnectionRef.current.addTrack(audioTrack, stream);
        }
        if (videoTrack) {
          peerConnectionRef.current.addTrack(videoTrack, stream);
        }

        // Handle incoming tracks
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Join room with role
        socketRef.current.emit("join-room", { roomId, isAdmin });

        // Handle signaling
        socketRef.current.on("user-connected", async () => {
          if (
            isAdmin &&
            peerConnectionRef.current &&
            !isNegotiatingRef.current
          ) {
            try {
              isNegotiatingRef.current = true;
              await peerConnectionRef.current.setLocalDescription();
              socketRef.current?.emit("offer", {
                roomId,
                offer: peerConnectionRef.current.localDescription,
              });
            } catch (error) {
              console.error("Error creating offer:", error);
            } finally {
              isNegotiatingRef.current = false;
            }
          }
        });

        socketRef.current.on("offer", async ({ offer }) => {
          if (
            !isAdmin &&
            peerConnectionRef.current &&
            !isNegotiatingRef.current
          ) {
            try {
              isNegotiatingRef.current = true;
              await peerConnectionRef.current.setRemoteDescription(offer);
              await peerConnectionRef.current.setLocalDescription();
              socketRef.current?.emit("answer", {
                roomId,
                answer: peerConnectionRef.current.localDescription,
              });
            } catch (error) {
              console.error("Error handling offer:", error);
            } finally {
              isNegotiatingRef.current = false;
            }
          }
        });

        socketRef.current.on("answer", async ({ answer }) => {
          if (
            isAdmin &&
            peerConnectionRef.current &&
            !isNegotiatingRef.current
          ) {
            try {
              if (peerConnectionRef.current.signalingState !== "stable") {
                await peerConnectionRef.current.setRemoteDescription(answer);
              }
            } catch (error) {
              console.error("Error setting remote description:", error);
            }
          }
        });

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current?.emit("ice-candidate", {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        socketRef.current.on("ice-candidate", async ({ candidate }) => {
          try {
            if (peerConnectionRef.current && candidate) {
              await peerConnectionRef.current.addIceCandidate(candidate);
            }
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        });

        setIsConnecting(false);
      } catch (error) {
        console.error("Error initializing video call:", error);
        setIsConnecting(false);
      }
    };

    init();

    return () => {
      // Cleanup
      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      peerConnectionRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [roomId, isAdmin]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Connecting to video call...</span>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-muted"
          />
          <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            You ({isAdmin ? "Admin" : "User"})
          </p>
        </div>
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-muted"
          />
          <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {isAdmin ? "User" : "Support Agent"}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleMute}
        >
          {isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleVideo}
        >
          {isVideoOff ? (
            <VideoOff className="h-5 w-5" />
          ) : (
            <Video className="h-5 w-5" />
          )}
        </Button>
      </div>
    </Card>
  );
}
