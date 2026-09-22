import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAuthToken } from '@/services/storage.service';
import { mealService } from '@/services/meal.service';

interface VoiceMealRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalyzeVoice: (params: {
    audioUri?: string;
    audioBase64?: string;
    mimeType?: string;
    transcriptText?: string;
  }) => void;
}

type RecordStep = 'recording' | 'transcribing' | 'preview_edit';

export const VoiceMealRecordModal: React.FC<VoiceMealRecordModalProps> = ({
  visible,
  onClose,
  onAnalyzeVoice,
}) => {
  const [step, setStep] = useState<RecordStep>('recording');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [statusMessage, setStatusMessage] = useState('Đang sẵn sàng...');

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(8)).current;
  const waveAnim2 = useRef(new Animated.Value(18)).current;
  const waveAnim3 = useRef(new Animated.Value(12)).current;
  const waveAnim4 = useRef(new Animated.Value(24)).current;
  const waveAnim5 = useRef(new Animated.Value(14)).current;

  // Refs for Web audio & speech recognition
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Maximum recording time in seconds
  const MAX_DURATION = 45;

  // Pulse animation loop
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.18,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim1, { toValue: 32, duration: 400, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 48, duration: 550, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 56, duration: 450, useNativeDriver: false }),
            Animated.timing(waveAnim4, { toValue: 42, duration: 600, useNativeDriver: false }),
            Animated.timing(waveAnim5, { toValue: 30, duration: 500, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim1, { toValue: 10, duration: 400, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 16, duration: 550, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 12, duration: 450, useNativeDriver: false }),
            Animated.timing(waveAnim4, { toValue: 18, duration: 600, useNativeDriver: false }),
            Animated.timing(waveAnim5, { toValue: 10, duration: 500, useNativeDriver: false }),
          ]),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRecording]);

  // When modal becomes visible, reset and start recording
  useEffect(() => {
    if (visible) {
      setStep('recording');
      setTranscriptText('');
      setAudioBase64(null);
      setRecordDuration(0);
      setStatusMessage('Đang lắng nghe bạn nói...');
      startRecording();
    } else {
      stopRecordingCleanup();
    }
  }, [visible]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= MAX_DURATION - 1) {
            handleStopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  };

  // Start recording on Web or Mobile
  const startRecording = async () => {
    setIsRecording(true);
    setRecordDuration(0);
    triggerHaptic();

    if (Platform.OS === 'web') {
      try {
        // 1. Web Speech Recognition (Real-time live Vietnamese speech-to-text)
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = 'vi-VN';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + ' ';
            }
            if (currentTranscript.trim()) {
              setTranscriptText(currentTranscript.trim());
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[Web SpeechRecognition] error:', event.error);
          };

          try {
            recognition.start();
            speechRecognitionRef.current = recognition;
          } catch (e) {
            console.warn('SpeechRecognition already started or error:', e);
          }
        }

        // 2. MediaRecorder for Audio capture
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mime = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/ogg';
          setAudioMimeType(mime);

          const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mime });
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1] || result;
              setAudioBase64(base64);
            };
            reader.readAsDataURL(audioBlob);

            // Stop all tracks in stream
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start(250);
          mediaRecorderRef.current = mediaRecorder;
        }
      } catch (err: any) {
        console.warn('Microphone permission or recording error on web:', err);
        setStatusMessage('Không thể truy cập Microphone. Vui lòng cho phép quyền ghi âm.');
      }
    } else {
      // Mobile placeholder / notification
      setStatusMessage('Đang ghi âm bữa ăn của bạn...');
    }
  };

  const stopRecordingCleanup = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (Platform.OS === 'web') {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
        speechRecognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    }
  };

  // Handle Stop Recording -> Move to Preview & Edit (Cách 2)
  const handleStopRecording = async () => {
    triggerHaptic();
    stopRecordingCleanup();

    // If we have live transcript already (e.g. from Web Speech API)
    if (transcriptText.trim()) {
      setStep('preview_edit');
      return;
    }

    // If transcript is empty but we have audio, call backend transcribe
    setStep('transcribing');
    setStatusMessage('Đang chuyển đổi giọng nói thành chữ...');

    // Wait a brief tick for mediaRecorder.onstop to generate base64
    setTimeout(async () => {
      try {
        const token = await getAuthToken();
        if (token && audioBase64) {
          const res = await mealService.transcribeVoice(token, {
            audioBase64,
            mimeType: audioMimeType,
          });
          if (res && res.data && res.data.transcription) {
            setTranscriptText(res.data.transcription);
          }
        }
      } catch (err: any) {
        console.warn('Lỗi gọi transcribeVoice backend:', err);
      } finally {
        setStep('preview_edit');
      }
    }, 400);
  };

  // Re-record
  const handleReRecord = () => {
    triggerHaptic();
    setTranscriptText('');
    setAudioBase64(null);
    setRecordDuration(0);
    setStep('recording');
    setStatusMessage('Đang lắng nghe bạn nói...');
    startRecording();
  };

  // Step 2 Confirm: User clicks "Phân tích dinh dưỡng"
  const handleConfirmAnalyze = () => {
    if (!transcriptText.trim() && !audioBase64) {
      if (Platform.OS === 'web') {
        window.alert('Vui lòng nói hoặc nhập mô tả bữa ăn để AI phân tích!');
      } else {
        Alert.alert('Chưa có nội dung', 'Vui lòng nói hoặc nhập mô tả bữa ăn để AI phân tích.');
      }
      return;
    }

    triggerHaptic();
    onClose();

    // Trigger parent analysis
    onAnalyzeVoice({
      audioBase64: audioBase64 || undefined,
      mimeType: audioMimeType,
      transcriptText: transcriptText.trim(),
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeContainer}>
              <MaterialCommunityIcons name="microphone-outline" size={16} color="#10B981" />
              <Text style={styles.badgeText}>AI Voice Nutrition</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* STEP 1: RECORDING SCREEN */}
          {step === 'recording' && (
            <View style={styles.body}>
              <Text style={styles.mainTitle}>Hãy nói về bữa ăn của bạn</Text>
              <Text style={styles.subtitle}>
                Ví dụ: "1 bát phở bò tái ít bánh, 1 quả trứng chần và 1 ly trà đá"
              </Text>

              {/* Glowing animated mic circle */}
              <View style={styles.micWrapper}>
                <Animated.View
                  style={[
                    styles.micGlow,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.18],
                        outputRange: [0.35, 0.75],
                      }),
                    },
                  ]}
                />
                <View style={styles.micCircle}>
                  <Ionicons name="mic" size={44} color="#FFFFFF" />
                </View>
              </View>

              {/* Sound wave bars */}
              <View style={styles.waveformContainer}>
                <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
                <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
                <Animated.View style={[styles.waveBar, { height: waveAnim3, backgroundColor: '#10B981' }]} />
                <Animated.View style={[styles.waveBar, { height: waveAnim4, backgroundColor: '#059669' }]} />
                <Animated.View style={[styles.waveBar, { height: waveAnim5 }]} />
                <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
                <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
              </View>

              {/* Timer */}
              <View style={styles.timerRow}>
                <View style={styles.recordingDot} />
                <Text style={styles.timerText}>
                  {formatTimer(recordDuration)} / {formatTimer(MAX_DURATION)}
                </Text>
              </View>

              {/* Live transcript text box */}
              {transcriptText ? (
                <View style={styles.liveTranscriptBox}>
                  <Text style={styles.liveTranscriptLabel}>Đang nhận diện:</Text>
                  <Text style={styles.liveTranscriptContent}>"{transcriptText}"</Text>
                </View>
              ) : (
                <Text style={styles.statusMessage}>{statusMessage}</Text>
              )}

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.stopBtn} onPress={handleStopRecording}>
                  <Ionicons name="stop" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.stopBtnText}>Dừng & Xem lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP: TRANSCRIBING LOADING */}
          {step === 'transcribing' && (
            <View style={[styles.body, { paddingVertical: 40 }]}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={[styles.mainTitle, { marginTop: 20 }]}>Đang xử lý âm thanh...</Text>
              <Text style={styles.subtitle}>AI đang nhận diện giọng nói tiếng Việt của bạn</Text>
            </View>
          )}

          {/* STEP 2: PREVIEW & EDIT SCREEN (CÁCH 2 - KIỂM TRA LẠI VĂN BẢN) */}
          {step === 'preview_edit' && (
            <View style={styles.body}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Bước 2/2</Text>
                </View>
                <Text style={styles.mainTitle}>Kiểm tra nội dung</Text>
              </View>

              <Text style={styles.subtitle}>
                Kiểm tra lại tên món ăn hoặc định lượng vừa nói. Bạn có thể sửa trực tiếp bên dưới nếu cần:
              </Text>

              {/* Editable text box */}
              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.transcriptInput}
                  multiline
                  numberOfLines={4}
                  value={transcriptText}
                  onChangeText={setTranscriptText}
                  placeholder="Ví dụ: 1 đĩa cơm sườn bì chả, 1 ly cà phê sữa đá ít ngọt..."
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
                <Text style={styles.charCountHint}>
                  {transcriptText.length > 0 ? `${transcriptText.length} ký tự` : 'Chưa có nội dung'}
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.reRecordBtn} onPress={handleReRecord}>
                  <Ionicons name="refresh" size={18} color="#0F766E" style={{ marginRight: 4 }} />
                  <Text style={styles.reRecordBtnText}>Nói lại</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.analyzeBtn} onPress={handleConfirmAnalyze}>
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.analyzeBtnText}>Phân tích dinh dưỡng</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    alignItems: 'center',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  micWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    width: 120,
    height: 120,
  },
  micGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#A7F3D0',
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 60,
    marginBottom: 10,
  },
  waveBar: {
    width: 4.5,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  liveTranscriptBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  liveTranscriptLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  liveTranscriptContent: {
    fontSize: 15,
    color: '#166534',
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  statusMessage: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  textInputWrapper: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  transcriptInput: {
    fontSize: 15.5,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 24,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCountHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  stopBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  stopBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reRecordBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#CCFBF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  reRecordBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  analyzeBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
