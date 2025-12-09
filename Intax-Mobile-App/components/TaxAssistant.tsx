import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AssistantMessage, TaxAssistantService } from '../services/taxAssistant';

interface TaxAssistantProps {
  onClose?: () => void;
  initialQuestion?: string;
}

const { width } = Dimensions.get('window');

export const TaxAssistant: React.FC<TaxAssistantProps> = ({ 
  onClose, 
  initialQuestion 
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const { user } = useAuth();

  const styles = createStyles(colors);

  useEffect(() => {
    initializeAssistant();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  const initializeAssistant = async () => {
    const welcomeMessage: AssistantMessage = {
      id: 'welcome',
      text: `👋 **Tongasoa amin'ny mpanampy fiscal IN-TAX!**\n\nAfaka manampy anao amin'ny:\n• 💰 **Kajy hetra** sy fanisana\n• 📋 **Famaranana** taratasy\n• 💳 **Fandoavam-bola** hetra\n• 🔢 **NIF** sy fisoratana\n• 📅 **Daty farany** fandoavana\n• 📊 **Karazana asa** sy tarifa\n\n*Inona no azoko ato ho anao?*`,
      isUser: false,
      timestamp: new Date(),
      type: 'suggestion',
      quickReplies: TaxAssistantService.getSuggestedQuestions()
    };

    setMessages([welcomeMessage]);

    if (user) {
      try {
        const context = await TaxAssistantService.getUserContext(user.id);
        setUserContext(context);
      } catch (error) {
        console.error('Erreur chargement contexte:', error);
      }
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      type: 'question'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const assistantMessage = await TaxAssistantService.askQuestion(
        messageText, 
        userContext
      );
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AssistantMessage = {
        id: Date.now().toString(),
        text: "⚠️ *Miala tsiny fa nisy olana.*\nAzafady, andramo indray na antsoy ny fanampiana amin'ny 034 20 152 72.",
        isUser: false,
        timestamp: new Date(),
        type: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (question: string) => {
    handleSendMessage(question);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('mg-MG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessageBubble = (message: AssistantMessage) => {
    const isUser = message.isUser;
    
    return (
      <View 
        key={message.id} 
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatarSmall}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : getMessageBubbleStyle(message.type),
          isUser ? styles.userShadow : styles.assistantShadow
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText,
            message.type === 'warning' && styles.warningText,
            message.type === 'suggestion' && styles.suggestionText
          ]}>
            {message.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isUser ? styles.userMessageTime : styles.assistantMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
            {isUser && (
              <Ionicons 
                name="checkmark-done" 
                size={12} 
                color={colors.primary} 
                style={styles.deliveryIcon}
              />
            )}
          </View>
        </View>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const getMessageBubbleStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return styles.warningBubble;
      case 'suggestion':
        return styles.suggestionBubble;
      default:
        return styles.assistantBubble;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.assistantAvatar}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          
          <View style={styles.assistantInfo}>
            <Text style={styles.assistantName}>Mpanampy Fiscal</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusIndicator} />
              <Text style={styles.assistantStatus}>
                {isLoading ? 'Miandry...' : 'Mila fanampiana?'}
              </Text>
            </View>
          </View>
        </View>
        
        {onClose && (
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <View style={styles.closeButtonCircle}>
              <Ionicons name="close" size={20} color={colors.text} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.gradientTop} />
        
        {messages.map(renderMessageBubble)}
        
        {messages[messages.length - 1]?.quickReplies && !messages[messages.length - 1]?.isUser && (
          <View style={styles.quickRepliesContainer}>
            <Text style={styles.quickRepliesTitle}>Fanontaniana hafa mety:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.quickRepliesScroll}
              contentContainerStyle={styles.quickRepliesContent}
            >
              {messages[messages.length - 1]?.quickReplies?.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyButton}
                  onPress={() => handleQuickReply(reply)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                  <Text style={styles.quickReplyText} numberOfLines={2}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.typingText}>Mpanampy fiscal miasa...</Text>
            </View>
            <View style={styles.typingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        )}
        
        <View style={styles.gradientBottom} />
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsBar}
          contentContainerStyle={styles.suggestionsContent}
        >
          {TaxAssistantService.getSuggestedQuestions().map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleQuickReply(question)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionItemText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Anontanio ny mpanampy fiscal..."
            placeholderTextColor={colors.secondary + '80'}
            multiline
            maxLength={500}
            numberOfLines={3}
            textAlignVertical="center"
            onSubmitEditing={() => handleSendMessage()}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            <View style={[
              styles.sendButtonInner,
              inputText.trim() && styles.sendButtonActive
            ]}>
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#fff' : colors.secondary + '80'} 
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={12} color={colors.secondary} />
          <Text style={styles.footerText}>
            Tapia-kevitra voatokana. Tsy azo zaraina amin&apos;ny hafa.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  assistantAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border + '30',
  },
  assistantInfo: {
    flex: 1,
  },
  assistantName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
    marginRight: 6,
  },
  assistantStatus: {
    fontSize: 13,
    color: colors.secondary, // Utilise secondary
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background + 'CC',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: colors.background,
  },
  gradientBottom: {
    height: 40,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 6,
  },
  warningBubble: {
    backgroundColor: '#FFF3CD',
    borderBottomLeftRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  suggestionBubble: {
    backgroundColor: '#E8F4FD',
    borderBottomLeftRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  userShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  assistantShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantMessageText: {
    color: colors.text,
  },
  warningText: {
    color: '#856404',
  },
  suggestionText: {
    color: '#0D47A1',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  userMessageTime: {
    color: '#FFFFFF' + 'CC',
  },
  assistantMessageTime: {
    color: colors.secondary, // Utilise secondary
  },
  deliveryIcon: {
    marginLeft: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickRepliesContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  quickRepliesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary, // Utilise secondary
    marginBottom: 12,
    marginLeft: 4,
  },
  quickRepliesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  quickRepliesContent: {
    paddingRight: 16,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border + '50',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickReplyText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 6,
    maxWidth: width * 0.5,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  typingText: {
    fontSize: 14,
    color: colors.secondary, // Utilise secondary
    marginLeft: 10,
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary, // Utilise secondary
    marginRight: 4,
  },
  dot1: {},
  dot2: {},
  dot3: {},
  inputArea: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border + '20',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  suggestionsBar: {
    marginBottom: 12,
  },
  suggestionsContent: {
    paddingRight: 16,
  },
  suggestionItem: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border + '50',
    marginRight: 8,
  },
  suggestionItemText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border + '50',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 12,
    paddingRight: 8,
    minHeight: 40,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border + '20',
  },
  footerText: {
    fontSize: 11,
    color: colors.secondary, // Utilise secondary
    marginLeft: 6,
    opacity: 0.7,
  },
});