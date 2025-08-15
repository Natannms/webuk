import { auth } from "@/firebaseConfig";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegisterScreen() {
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualiza o displayName
      await updateProfile(user, { displayName: name });

      // Salva no Zustand
      login(
        {
          id: user.uid,
          name: user.displayName || name,
          email: user.email || "",
        },
        user.refreshToken
      );

      // Redireciona para a tela principal
      router.replace("/(dashboard)/dashboard");

      Alert.alert("Sucesso", "Conta criada com sucesso!");
    } catch (error: any) {
      console.error("Register error:", error);
      Alert.alert("Erro ao registrar", error.message || "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold text-[#FF9500] mb-2">Crie sua conta</Text>
      <Text className="text-gray-500 mb-8">Preencha os campos abaixo para começar</Text>

      {/* Input Name */}
      <Text className="text-gray-700 mb-2">Nome</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Seu nome"
      />

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
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Sua senha"
      />

      {/* Input Confirm Password */}
      <Text className="text-gray-700 mb-2">Confirmar Senha</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="Repita a senha"
      />

      {/* Botão Registrar */}
      <TouchableOpacity
        onPress={handleRegister}
        className="bg-[#FF9500] py-4 rounded-lg mb-4"
        disabled={loading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {loading ? "Registrando..." : "Registrar"}
        </Text>
      </TouchableOpacity>

      {/* Link para login */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-500">Já tem conta? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/signin")}>
          <Text className="text-[#FF9500] font-bold">Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
