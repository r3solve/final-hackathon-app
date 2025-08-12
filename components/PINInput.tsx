import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';

interface PINInputProps {
  title: string;
  subtitle?: string;
  onPINComplete: (pin: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  error?: string;
  maxLength?: number;
  showPIN?: boolean;
  allowShowPIN?: boolean;
}

const { width } = Dimensions.get('window');
const PIN_LENGTH = 4;

export default function PINInput({
  title,
  subtitle,
  onPINComplete,
  onCancel,
  showCancel = false,
  error,
  maxLength = PIN_LENGTH,
  showPIN = false,
  allowShowPIN = false,
}: PINInputProps) {
  const [pin, setPin] = useState('');
  const [showPinValue, setShowPinValue] = useState(showPIN);
  const [isLocked, setIsLocked] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pin.length === maxLength) {
      onPINComplete(pin);
    }
  }, [pin, maxLength, onPINComplete]);

  const handlePinChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= maxLength) {
      setPin(numericText);
    }
  };

  const handleKeyPress = (key: string) => {
    if (isLocked) return;
    
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setPin('');
    } else if (pin.length < maxLength) {
      setPin(prev => prev + key);
    }
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderPINDisplay = () => {
    return (
      <View style={styles.pinDisplayContainer}>
        {Array.from({ length: maxLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              pin.length > index ? styles.pinDotFilled : styles.pinDotEmpty,
            ]}
          >
            {showPinValue && pin[index] && (
              <Text style={styles.pinText}>{pin[index]}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return (
      <View style={styles.keypadContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => (
              <TouchableOpacity
                key={keyIndex}
                style={[
                  styles.keypadKey,
                  key === 'delete' && styles.deleteKey,
                  key === '' && styles.emptyKey,
                ]}
                onPress={() => handleKeyPress(key)}
                disabled={isLocked}
              >
                {key === 'delete' ? (
                  <Text style={styles.deleteKeyText}>⌫</Text>
                ) : key === '' ? (
                  <View />
                ) : (
                  <Text style={styles.keypadKeyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Lock size={32} color="#22C55E" />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.pinContainer,
          {
            transform: [{ translateX: shakeAnimation }],
          },
        ]}
      >
        {renderPINDisplay()}
      </Animated.View>

      {allowShowPIN && (
        <TouchableOpacity
          style={styles.showPinButton}
          onPress={() => setShowPinValue(!showPinValue)}
        >
          {showPinValue ? (
            <>
              <EyeOff size={16} color="#6B7280" />
              <Text style={styles.showPinText}>Hide PIN</Text>
            </>
          ) : (
            <>
              <Eye size={16} color="#6B7280" />
              <Text style={styles.showPinText}>Show PIN</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {renderKeypad()}

      {showCancel && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Hidden TextInput for keyboard input */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={pin}
        onChangeText={handlePinChange}
        keyboardType="numeric"
        maxLength={maxLength}
        autoFocus={false}
        onFocus={() => inputRef.current?.blur()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pinDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotEmpty: {
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    borderColor: '#22C55E',
    backgroundColor: '#22C55E',
  },
  pinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  showPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 32,
  },
  showPinText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  keypadContainer: {
    marginBottom: 32,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  keypadKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteKey: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  emptyKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keypadKeyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  deleteKeyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC2626',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
});
