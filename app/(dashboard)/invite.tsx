import { auth } from '@/firebaseConfig';
import { CoupleService } from '@/services/CoupleService';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InvitePartnerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira um email');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);

      const result = await CoupleService.invitePartner(
        user.uid,
        user.email!,
        email.trim().toLowerCase()
      );

      if (result.success) {
        Alert.alert(
          'Convite Enviado! 🎉',
          `Um convite foi enviado para ${email}. Quando eles se cadastrarem no app usando este email, vocês serão automaticamente pareados.`,
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
        setEmail('');
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível enviar o convite');
      }
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ paddingTop: insets.top, backgroundColor: '#F8FAFB' }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />

        {/* Header */}
        <View className="flex-row items-center px-6 py-4 bg-white" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <TouchableOpacity
           onPress={() => router.back()}

            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">Convidar Parceiro(a)</Text>
            <Text className="text-sm text-gray-500">Compartilhem os cuidados juntos</Text>
          </View>
        </View>

        <View className="flex-1 px-6 py-8">
          {/* Ilustração e descrição */}
          <View className="items-center mb-10">
            <View
              className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="mail" size={40} color="#3B82F6" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
              Convide por Email
            </Text>

            <Text className="text-gray-600 text-center text-base leading-6 px-4">
              Digite o email do seu(sua) parceiro(a). Quando eles se cadastrarem no app usando este email, vocês serão automaticamente conectados.
            </Text>
          </View>

          {/* Formulário */}
          <View
            className="bg-white rounded-2xl p-6 mb-8"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Text className="text-lg font-bold text-gray-900 mb-6 text-center">
              Email do(a) Parceiro(a)
            </Text>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Email</Text>
              <View className="relative">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="parceiro@email.com"
                  className="bg-gray-50 p-4 rounded-xl text-base pr-12"
                  style={{
                    borderWidth: 2,
                    borderColor: '#E5E7EB',
                    fontSize: 16
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <View className="absolute right-4 top-4">
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleInvite}
              disabled={loading}
              className="bg-blue-500 py-4 rounded-xl items-center"
              style={{
                opacity: loading ? 0.7 : 1,
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-base ml-2">Enviando...</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="send" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Enviar Convite</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Informações importantes */}
          <View className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-blue-800 mb-2">Como funciona:</Text>
                <Text className="text-sm text-blue-700 leading-5">
                  • O convite é enviado automaticamente{'\n'}
                  • Quando seu(sua) parceiro(a) se cadastrar com este email, vocês serão conectados{'\n'}
                  • Vocês poderão compartilhar medicamentos e lembretes{'\n'}
                  • Apenas 2 pessoas podem formar um casal
                </Text>
              </View>
            </View>
          </View>

          {/* Espaçador para não ficar colado no bottom */}
          <View style={{ height: insets.bottom + 20 }} />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}