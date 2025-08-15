import { auth } from "@/firebaseConfig"; // seu arquivo de configuração Firebase
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignInScreen() {
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualiza Zustand com dados do usuário
      login({
        id: user.uid,
        name: user.displayName || "Usuário",
        email: user.email || "",
      }, user.refreshToken);

      
      router.replace("/(dashboard)/dashboard"); 
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Erro ao entrar", error.message || "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold text-[#FF9500] mb-2">Bem-vindo de volta!</Text>
      <Text className="text-gray-500 mb-8">Entre com sua conta para continuar</Text>

      {/* Input Email */}
      <Text className="text-gray-700 mb-2">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="email@exemplo.com"
      />

      {/* Input Password */}
      <Text className="text-gray-700 mb-2">Senha</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="Sua senha"
      />

      {/* Botão Login */}
      <TouchableOpacity
        onPress={handleSignIn}
        className="bg-[#FF9500] py-4 rounded-lg mb-4"
        disabled={loading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {loading ? "Entrando..." : "Entrar"}
        </Text>
      </TouchableOpacity>

      {/* Separador */}
      <View className="flex-row items-center justify-center mb-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="px-3 text-gray-400">ou</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Botão social (exemplo Google) */}
      <TouchableOpacity
        onPress={() => Alert.alert("Login social", "Implementar login social")}
        className="border border-gray-300 py-3 rounded-lg mb-3 flex-row justify-center items-center"
      >
        <Text className="text-gray-700 font-medium">Entrar com Google</Text>
      </TouchableOpacity>

      {/* Link para registro */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-500">Não tem conta? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text className="text-[#FF9500] font-bold">Registrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
