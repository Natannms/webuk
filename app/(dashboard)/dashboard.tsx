import { firestore } from "@/firebaseConfig";
import { logoutUser } from "@/services/AuthService";
import { CoupleService } from "@/services/CoupleService";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import { useNotificationStore } from "@/store/notifyStore";
import { collection_prefix, InviteData, NotificationCouple } from "@/types/couples.interfaces";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Dimensions, Modal, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');

  // Dados de exemplo
  const medications = [
    {
      id: 1,
      time: "8:00 AM",
      name: "Vitamin D 5000 IU",
      dose: "1 capsule",
      notes: "After meal",
      type: "pill",
      completed: true,
      timeRange: "8:00 AM",
      color: "#FF9500",
      bgColor: "#FFF4E6"
    },
    {
      id: 2,
      time: "8:30 - 9:00 AM",
      name: "Aspirin 200 mg",
      dose: "1 tablet",
      notes: "",
      type: "pill",
      completed: false,
      timeRange: "8:30 - 9:00 AM",
      color: "#FF4757",
      bgColor: "#FFE8EA"
    },
    {
      id: 3,
      time: "5:30 PM",
      name: "Eye drops",
      dose: "5 drops",
      notes: "",
      type: "drops",
      completed: false,
      timeRange: "5:30 PM",
      color: "#4DA6FF",
      bgColor: "#E8F2FF"
    },
    {
      id: 4,
      time: "6:00 - 6:30 PM",
      name: "Vitamin D 5000 IU",
      dose: "1 capsule",
      notes: "After meal",
      type: "pill",
      completed: false,
      timeRange: "6:00 - 6:30 PM",
      color: "#FF9500",
      bgColor: "#FFF4E6"
    },
  ];

  //**sobre Invites */
  const coupleData = useCoupleStore((state) => state.data);
  const clearInvite = useCoupleStore((state) => state.clearInvite);
  const coupleStore = useCoupleStore();
  const {addNotifications} =  useNotificationStore()
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const completedCount = medications.filter(med => med.completed).length;
  const progressPercentage = (completedCount / medications.length) * 100;
  const userState = useAuthStore()
  const logoutExec = async () => {
    const logoutEdUser = await logoutUser()
    if (logoutEdUser.success) {
      userState.logout()
      console.log("Logout realizado com sucesso")
      router.replace("/(auth)/signin")
      return
    }

    console.log("Erro ao realizar logout")
  }

  useEffect(() => {
    if (coupleData) {
      setShowInviteModal(true);
    }
  }, [coupleData]);

  useEffect(() => {
    if (!userState.user) return;



    const q = query(
      collection(firestore, collection_prefix + "couples"),
      where("members", "array-contains", userState.user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log("Novo casal encontrado:", change.doc.data());
        }
      });
    });



    return () => unsubscribe();
  }, [userState.user?.id]);


  useEffect(() => {
    if (!userState.user) return;

    const inviteQuery = query(
      collection(firestore, collection_prefix + "invites"),
      where("status", "==", "pending"),
      where("invitedEmail", "==", userState.user.email.toLowerCase())
    );

    const unsubscribeInvites = onSnapshot(inviteQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const inviteData = change.doc.data() as InviteData;
          if(!coupleStore.coupleId){
            coupleStore.setInvite(inviteData);
            setShowInviteModal(true)
          }
        }
      });
    });

    return unsubscribeInvites
  }, [])

  useEffect(() => {
    if (!userState.user) return;

    const notificationQuery = query(
      collection(firestore, collection_prefix + "notification"),
      where("status", "==", "pending"),
      where("senderId", "==", userState.user.id)
    );

    const unsubscribeInvites = onSnapshot(notificationQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notificationData = change.doc.data() as NotificationCouple[];
          if(!coupleStore.coupleId){
            addNotifications(notificationData);
          }
        }
      });
    });

    return unsubscribeInvites
  }, [])

  const handleAcceptInvite = () => {
    Alert.alert(
      "Confirmação",
      "Tem certeza que gostaria de aceitar o convite?",
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            const accpetInvite = await CoupleService.acceptInvite(userState.user!.id, userState.user!.email)
            if (accpetInvite.error) {
              Alert.alert(accpetInvite.error)
              setShowInviteModal(false);
              return
            }

            coupleStore.setCoupleId(accpetInvite.coupleId!)
            setShowInviteModal(false);
            clearInvite();
            Alert.alert("Convite aceito!");
          },
        },
      ],
      { cancelable: true }
    );
  };
  const handleNotAcceptInvite = () => {
    Alert.alert(
      "Confirmação",
      "Tem certeza que gostaria de cancelar o convite?",
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            const cancelInvite = await CoupleService.cancelInvite(coupleStore.data!.id!)
            if (cancelInvite.error) {
              Alert.alert(cancelInvite.error)
              setShowInviteModal(false);
              return
            }
            setShowInviteModal(false);
            clearInvite();
            Alert.alert("Convite cancelado com sucesso!");
          },
        },
      ],
      { cancelable: true }
    );
  };
  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: '#F8FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      {/* Modal de convite */}
      <Modal
        animationType="fade"
        transparent
        visible={showInviteModal}
      >
        <View className="bg-black/70 flex-1 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-11/12 max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-2">Novo Convite Recebido</Text>
            <Text className="text-gray-600 mb-4">Você recebeu um convite para formar um casal com {coupleData?.inviterEmail || "alguém"} no por aqui.</Text>
            <Pressable
              className="bg-blue-500 rounded-xl py-3 items-center"
              onPress={handleAcceptInvite}
            >
              <Text className="text-white font-semibold text-base">Aceitar Convite</Text>
            </Pressable>
            <Pressable
              className="mt-3 rounded-xl py-3 items-center border border-gray-300"
              onPress={handleNotAcceptInvite}
            >
              <Text className="text-gray-700 font-medium">Recusar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Header profissional */}
      <View className="px-6 pt-4 pb-2 bg-white" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-gray-900">February</Text>
            <Text className="text-sm text-gray-500 mt-1">Medication Schedule</Text>
          </View>
          <View className="flex px-4 flex-row gap-4 justify-between">
            <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <Ionicons name="notifications-outline" size={22} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center" onPress={() => logoutExec()}>
              <Ionicons name="exit" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Card */}
        <View className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl mb-4" style={{
          backgroundColor: '#EEF2FF',
          borderWidth: 1,
          borderColor: '#E0E7FF'
        }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Today's Progress</Text>
            <Text className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <View
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
          <Text className="text-sm text-gray-600">{completedCount} of {medications.length} medications taken</Text>
        </View>

        {/* Calendar com navegação */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-xl">
            <Text className="text-white text-sm font-semibold">Week</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-2">
            <Text className="text-gray-500 text-sm font-medium">Month</Text>
          </TouchableOpacity>
          <View className="flex-1" />
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <Ionicons name="chevron-back" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center ml-2">
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Calendário semanal elegante */}
        <View className="flex-row justify-between px-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <TouchableOpacity key={idx} className="items-center flex-1 py-3">
              <Text className={`text-xs font-medium mb-2 ${idx === 3 ? 'text-blue-600' : 'text-gray-400'}`}>{day}</Text>
              <View className={`w-10 h-10 rounded-xl items-center justify-center ${idx === 3 ? 'bg-blue-500 shadow-lg' : 'bg-transparent'
                }`} style={idx === 3 ? {
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                } : {}}>
                <Text className={`text-base font-bold ${idx === 3 ? 'text-white' : 'text-gray-700'}`}>
                  {17 + idx}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        style={{ paddingTop: 24 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle switch profissional */}
        <View className="flex-row items-center justify-between mb-8 bg-white p-4 rounded-2xl" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
        }}>
          <View>
            <Text className="text-base font-semibold text-gray-900">Show round schedule</Text>
            <Text className="text-sm text-gray-500 mt-1">Display medications in rounds</Text>
          </View>
          <TouchableOpacity
            className="w-14 h-8 bg-blue-500 rounded-full justify-center px-1"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
          >
            <View className="w-6 h-6 bg-white rounded-full ml-auto shadow-sm" />
          </TouchableOpacity>
        </View>

        {/* Seção Morning */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
            <Text className="text-xl font-bold text-gray-900">Morning</Text>
            <View className="flex-1 h-px bg-gray-200 ml-4" />
          </View>

          {/* Vitamin D Card Profissional */}
          <TouchableOpacity
            className="bg-white rounded-2xl mb-4 overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View className="p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: medications[0].bgColor }}
                  >
                    <View
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: medications[0].color }}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-lg font-bold text-gray-900">{medications[0].name}</Text>
                      {medications[0].completed && (
                        <View className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                      )}
                    </View>
                    <Text className="text-gray-600 text-sm mb-1">{medications[0].dose}</Text>
                    <Text className="text-blue-600 text-xs font-medium">{medications[0].notes}</Text>
                  </View>
                </View>
                <TouchableOpacity className="ml-3 p-2">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: medications[0].completed ? '#10B981' : '#E5E7EB' }}
                  >
                    <Ionicons
                      name={medications[0].completed ? "checkmark" : "ellipse-outline"}
                      size={16}
                      color={medications[0].completed ? "white" : "#9CA3AF"}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View className="h-1 bg-gradient-to-r from-green-500 to-green-400" />
          </TouchableOpacity>

          {/* Aspirin Card */}
          <TouchableOpacity
            className="bg-white rounded-2xl mb-4 overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View className="px-5 pt-3 pb-1">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{medications[1].timeRange}</Text>
            </View>
            <View className="px-5 pb-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: medications[1].bgColor }}
                  >
                    <View
                      className="w-6 h-3 rounded-full"
                      style={{ backgroundColor: medications[1].color }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{medications[1].name}</Text>
                    <Text className="text-gray-600 text-sm">{medications[1].dose}</Text>
                  </View>
                </View>
                <TouchableOpacity className="ml-3 p-2">
                  <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                    <Ionicons name="ellipse-outline" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Seção Day */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-6 bg-orange-500 rounded-full mr-3" />
            <Text className="text-xl font-bold text-gray-900">Day</Text>
            <View className="flex-1 h-px bg-gray-200 ml-4" />
          </View>

          {/* Eye drops Card */}
          <TouchableOpacity
            className="bg-white rounded-2xl mb-4 overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View className="px-5 pt-3 pb-1">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{medications[2].timeRange}</Text>
            </View>
            <View className="px-5 pb-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: medications[2].bgColor }}
                  >
                    <Ionicons name="water" size={20} color={medications[2].color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{medications[2].name}</Text>
                    <Text className="text-gray-600 text-sm">{medications[2].dose}</Text>
                  </View>
                </View>
                <TouchableOpacity className="ml-3 p-2">
                  <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                    <Ionicons name="ellipse-outline" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Evening Vitamin D Card */}
          <TouchableOpacity
            className="bg-white rounded-2xl mb-4 overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View className="px-5 pt-3 pb-1">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{medications[3].timeRange}</Text>
            </View>
            <View className="px-5 pb-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: medications[3].bgColor }}
                  >
                    <View
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: medications[3].color }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{medications[3].name}</Text>
                    <Text className="text-gray-600 text-sm">{medications[3].dose}</Text>
                    <Text className="text-blue-600 text-xs font-medium mt-1">{medications[3].notes}</Text>
                  </View>
                </View>
                <TouchableOpacity className="ml-3 p-2">
                  <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                    <Ionicons name="ellipse-outline" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button Premium */}
      <TouchableOpacity
        className="absolute bg-blue-500 w-16 h-16 rounded-2xl justify-center items-center"
        style={{
          bottom: 120 + insets.bottom,
          right: 24,
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <Ionicons name="add" color="white" size={28} />
      </TouchableOpacity>

      {/* Bottom Navigation Premium */}
      <View
        className="bg-white border-t border-gray-100"
        style={{
          paddingBottom: insets.bottom + 8,
          paddingTop: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View className="flex-row justify-around items-center px-6">
          <TouchableOpacity className="items-center py-2">
            <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mb-1">
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <Text className="text-xs text-gray-500 font-medium">Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2">
            <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mb-1">
              <Ionicons name="bar-chart-outline" size={20} color="#6B7280" />
            </View>
            <Text className="text-xs text-gray-500 font-medium">Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2" onPress={() => router.push('/trips')}>
            <View className="w-10 h-10 bg-blue-500 rounded-xl items-center justify-center mb-1" style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              <Ionicons name="calendar" size={20} color="white" />
            </View>
            <Text className="text-xs text-blue-600 font-semibold">Trips</Text>
          </TouchableOpacity>

         {!coupleStore.coupleId && (
           <TouchableOpacity className="items-center py-2" onPress={() => router.push('/invite')}>
           <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mb-1">
             <Ionicons name="medical-outline" size={20} color="#6B7280" />
           </View>
           <Text className="text-xs text-gray-500 font-medium">Couple</Text>
         </TouchableOpacity>
         )}
        </View>
      </View>
    </View>
  );
}