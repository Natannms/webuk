import { TripService } from "@/services/TripService";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import { TripData, TripStatus, NewTripInput } from "@/types/trips.interfaces";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { 
  Alert, 
  Dimensions, 
  Modal, 
  Pressable, 
  ScrollView, 
  StatusBar, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View 
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');

  // Estados globais
  const userState = useAuthStore();
  const coupleStore = useCoupleStore();

  // Estados locais
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Estados do formulário
  const [tripForm, setTripForm] = useState<NewTripInput>({
    coupleId: String(coupleStore.coupleId) || "",
    ownerUserId: userState.user?.id || "",
    name: "",
    year: new Date().getFullYear(),
    mainDestination: "",
    status: "planned",
    estimatedPeriod: {
      kind: "dates",
      startDate: null,
      endDate: null,
      year: new Date().getFullYear()
    },
    description: ""
  });

  // Carregar trips
  useEffect(() => {
    loadTrips();
  }, [String(coupleStore.coupleId)]);

  const loadTrips = async () => {
    if (!String(coupleStore.coupleId)) return;
    
    setLoading(true);
    try {
      const tripsData = await TripService.getTripsByCouple(String(coupleStore.coupleId));
      setTrips(tripsData);
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!tripForm.name.trim() || !tripForm.mainDestination.trim()) {
      Alert.alert("Erro", "Nome e destino são obrigatórios");
      return;
    }

    try {
      const result = await TripService.createTrip(tripForm);
      
      if (result.error) {
        Alert.alert("Erro", result.error);
        return;
      }

      Alert.alert("Sucesso", "Viagem criada com sucesso!");
      setShowCreateModal(false);
      resetForm();
      loadTrips();
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar viagem");
    }
  };

  const handleUpdateStatus = async (tripId: string, newStatus: TripStatus) => {
    try {
      const result = await TripService.setStatus(tripId, newStatus);
      
      if (result.error) {
        Alert.alert("Erro", result.error);
        return;
      }

      loadTrips();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar status");
    }
  };

  const handleDeleteTrip = (trip: TripData) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a viagem "${trip.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const result = await TripService.deleteTrip(trip.id!);
            if (result.error) {
              Alert.alert("Erro", result.error);
            } else {
              Alert.alert("Sucesso", "Viagem excluída!");
              loadTrips();
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setTripForm({
      coupleId: String(coupleStore.coupleId) || "",
      ownerUserId: userState.user?.id || "",
      name: "",
      year: new Date().getFullYear(),
      mainDestination: "",
      status: "planned",
      estimatedPeriod: {
        kind: "dates",
        startDate: null,
        endDate: null,
        year: new Date().getFullYear()
      },
      description: ""
    });
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case "planned": return { bg: "#EEF2FF", text: "#3B82F6", color: "#3B82F6" };
      case "ongoing": return { bg: "#FEF3C7", text: "#D97706", color: "#F59E0B" };
      case "completed": return { bg: "#DCFCE7", text: "#16A34A", color: "#22C55E" };
      case "canceled": return { bg: "#FEE2E2", text: "#DC2626", color: "#EF4444" };
      default: return { bg: "#F3F4F6", text: "#6B7280", color: "#9CA3AF" };
    }
  };

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case "planned": return "Planejada";
      case "ongoing": return "Em Andamento";
      case "completed": return "Concluída";
      case "canceled": return "Cancelada";
      default: return status;
    }
  };

  const formatPeriod = (period: TripData['estimatedPeriod']) => {
    if (period.kind === "dates") {
      if (period.startDate && period.endDate) {
        return `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`;
      }
      return "Período não definido";
    } else {
      if (period.startDate && period.endDate && period.year) {
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${months[period.startDate - 1]} - ${months[period.endDate - 1]}/${period.year}`;
      }
      return "Período não definido";
    }
  };

  if (!String(coupleStore.coupleId)) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">Conecte-se com seu parceiro</Text>
        <Text className="text-gray-500 text-center px-8 mb-6">
          Você precisa estar conectado a um casal para gerenciar viagens
        </Text>
        <TouchableOpacity 
          className="bg-blue-500 px-6 py-3 rounded-xl"
          onPress={() => router.push('/invite')}
        >
          <Text className="text-white font-semibold">Conectar Agora</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: '#F8FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      
      {/* Modal de criação de viagem */}
      <Modal
        animationType="slide"
        transparent
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="bg-black/50 flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: screenHeight * 0.9 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">Nova Viagem</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className="text-base font-semibold text-gray-900 mb-2">Nome da Viagem *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="Ex: Lua de mel em Paris"
                    value={tripForm.name}
                    onChangeText={(text) => setTripForm(prev => ({ ...prev, name: text }))}
                  />
                </View>

                <View>
                  <Text className="text-base font-semibold text-gray-900 mb-2">Destino Principal *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="Ex: Paris, França"
                    value={tripForm.mainDestination}
                    onChangeText={(text) => setTripForm(prev => ({ ...prev, mainDestination: text }))}
                  />
                </View>

                <View>
                  <Text className="text-base font-semibold text-gray-900 mb-2">Ano</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="2024"
                    value={tripForm.year.toString()}
                    onChangeText={(text) => {
                      const newYear = parseInt(text) || new Date().getFullYear();
                      setTripForm(prev => ({
                        ...prev,
                        year: newYear,
                        estimatedPeriod: {
                          ...prev.estimatedPeriod,
                          year: newYear
                        }
                      }));
                    }}
                    keyboardType="numeric"
                  />
                </View>

                {/* Seletor de tipo de período */}
                <View>
                  <Text className="text-base font-semibold text-gray-900 mb-3">Tipo de Período</Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className={`flex-1 p-3 rounded-xl border-2 ${
                        tripForm.estimatedPeriod.kind === "dates"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                      onPress={() =>
                        setTripForm(prev => ({
                          ...prev,
                          estimatedPeriod: {
                            kind: "dates",
                            startDate: null,
                            endDate: null,
                            year: prev.year
                          }
                        }))
                      }
                    >
                      <Text className={`text-center font-semibold ${
                        tripForm.estimatedPeriod.kind === "dates"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}>
                        Datas Específicas
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className={`flex-1 p-3 rounded-xl border-2 ${
                        tripForm.estimatedPeriod.kind === "months"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                      onPress={() =>
                        setTripForm(prev => ({
                          ...prev,
                          estimatedPeriod: {
                            kind: "months",
                            startDate: null,
                            endDate: null,
                            year: prev.year
                          }
                        }))
                      }
                    >
                      <Text className={`text-center font-semibold ${
                        tripForm.estimatedPeriod.kind === "months"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}>
                        Por Meses
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Campos de período baseados no tipo selecionado */}
                {tripForm.estimatedPeriod.kind === "dates" ? (
                  <View className="space-y-4">
                    <View>
                      <Text className="text-base font-semibold text-gray-900 mb-2">Data de Início</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="dd/mm/aaaa"
                        value={
                          tripForm.estimatedPeriod.startDate
                            ? tripForm.estimatedPeriod.startDate.toLocaleDateString('pt-BR')
                            : ""
                        }
                        onChangeText={(text) => {
                          // Parse da data no formato dd/mm/aaaa
                          const parts = text.split('/');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                            const year = parseInt(parts[2]);
                            
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                              const date = new Date(year, month, day);
                              if (tripForm.estimatedPeriod.kind === "dates") {
                                setTripForm(prev => ({
                                  ...prev,
                                  estimatedPeriod: {
                                    ...prev.estimatedPeriod,
                                    startDate: date
                                  }
                                }));
                              }
                            }
                          }
                        }}
                      />
                    </View>

                    <View>
                      <Text className="text-base font-semibold text-gray-900 mb-2">Data de Fim</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="dd/mm/aaaa"
                        value={
                          tripForm.estimatedPeriod.endDate
                            ? tripForm.estimatedPeriod.endDate.toLocaleDateString('pt-BR')
                            : ""
                        }
                        onChangeText={(text) => {
                          // Parse da data no formato dd/mm/aaaa
                          const parts = text.split('/');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                            const year = parseInt(parts[2]);
                            
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                              const date = new Date(year, month, day);
                              if (tripForm.estimatedPeriod.kind === "dates") {
                                setTripForm(prev => ({
                                  ...prev,
                                  estimatedPeriod: {
                                    ...prev.estimatedPeriod,
                                    endDate: date
                                  }
                                }));
                              }
                            }
                          }
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="space-y-4">
                    <View>
                      <Text className="text-base font-semibold text-gray-900 mb-2">Mês de Início</Text>
                      <View className="bg-gray-50 border border-gray-200 rounded-xl">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-2">
                          <View className="flex-row space-x-2">
                            {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((month, index) => (
                              <TouchableOpacity
                                key={index}
                                className={`px-3 py-2 rounded-lg ${
                                  tripForm.estimatedPeriod.startDate === index + 1
                                    ? "bg-blue-500"
                                    : "bg-white"
                                }`}
                                onPress={() => {
                                  if (tripForm.estimatedPeriod.kind === "months") {
                                    setTripForm(prev => ({
                                      ...prev,
                                      estimatedPeriod: {
                                        ...prev.estimatedPeriod,
                                        startDate: index + 1
                                      }
                                    }));
                                  }
                                }}
                              >
                                <Text className={`text-sm font-medium ${
                                  tripForm.estimatedPeriod.startDate === index + 1
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}>
                                  {month}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>

                    <View>
                      <Text className="text-base font-semibold text-gray-900 mb-2">Mês de Fim</Text>
                      <View className="bg-gray-50 border border-gray-200 rounded-xl">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-2">
                          <View className="flex-row space-x-2">
                            {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((month, index) => (
                              <TouchableOpacity
                                key={index}
                                className={`px-3 py-2 rounded-lg ${
                                  tripForm.estimatedPeriod.endDate === index + 1
                                    ? "bg-blue-500"
                                    : "bg-white"
                                }`}
                                onPress={() => {
                                  if (tripForm.estimatedPeriod.kind === "months") {
                                    setTripForm(prev => ({
                                      ...prev,
                                      estimatedPeriod: {
                                        ...prev.estimatedPeriod,
                                        endDate: index + 1
                                      }
                                    }));
                                  }
                                }}
                              >
                                <Text className={`text-sm font-medium ${
                                  tripForm.estimatedPeriod.endDate === index + 1
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}>
                                  {month}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                )}

                <View>
                  <Text className="text-base font-semibold text-gray-900 mb-2">Descrição</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-20"
                    placeholder="Descreva sua viagem dos sonhos..."
                    value={tripForm.description}
                    onChangeText={(text) => setTripForm(prev => ({ ...prev, description: text }))}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View className="flex-row space-x-3 mt-8 pb-6">
                <TouchableOpacity 
                  className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text className="text-gray-700 font-semibold">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-1 bg-blue-500 rounded-xl py-4 items-center"
                  onPress={handleCreateTrip}
                >
                  <Text className="text-white font-semibold">Criar Viagem</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de detalhes da viagem */}
      <Modal
        animationType="slide"
        transparent
        visible={showDetailsModal}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View className="bg-black/50 flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: screenHeight * 0.8 }}>
            {selectedTrip && (
              <>
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-2xl font-bold text-gray-900 flex-1">{selectedTrip.name}</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="space-y-6">
                    <View>
                      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</Text>
                      <View 
                        className="self-start px-3 py-1 rounded-full"
                        style={{ backgroundColor: getStatusColor(selectedTrip.status).bg }}
                      >
                        <Text 
                          className="text-sm font-semibold"
                          style={{ color: getStatusColor(selectedTrip.status).text }}
                        >
                          {getStatusText(selectedTrip.status)}
                        </Text>
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Destino</Text>
                      <Text className="text-lg text-gray-900">{selectedTrip.mainDestination}</Text>
                    </View>

                    <View>
                      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Período</Text>
                      <Text className="text-lg text-gray-900">{formatPeriod(selectedTrip.estimatedPeriod)}</Text>
                    </View>

                    <View>
                      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ano</Text>
                      <Text className="text-lg text-gray-900">{selectedTrip.year}</Text>
                    </View>

                    {selectedTrip.description && (
                      <View>
                        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Descrição</Text>
                        <Text className="text-base text-gray-700 leading-6">{selectedTrip.description}</Text>
                      </View>
                    )}

                    {/* Ações */}
                    <View className="space-y-3 mt-8 pb-6">
                      {selectedTrip.status === "planned" && (
                        <TouchableOpacity 
                          className="bg-yellow-500 rounded-xl py-4 items-center"
                          onPress={() => handleUpdateStatus(selectedTrip.id!, "ongoing")}
                        >
                          <Text className="text-white font-semibold">Iniciar Viagem</Text>
                        </TouchableOpacity>
                      )}
                      
                      {selectedTrip.status === "ongoing" && (
                        <TouchableOpacity 
                          className="bg-green-500 rounded-xl py-4 items-center"
                          onPress={() => handleUpdateStatus(selectedTrip.id!, "completed")}
                        >
                          <Text className="text-white font-semibold">Concluir Viagem</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity 
                        className="border border-red-300 rounded-xl py-4 items-center"
                        onPress={() => handleDeleteTrip(selectedTrip)}
                      >
                        <Text className="text-red-600 font-semibold">Excluir Viagem</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-gray-900">Viagens</Text>
            <Text className="text-sm text-gray-500 mt-1">Planeje suas aventuras em casal</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Estatísticas */}
        <View className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl" style={{
          backgroundColor: '#EEF2FF',
          borderWidth: 1,
          borderColor: '#E0E7FF'
        }}>
          <View className="flex-row justify-between items-center">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">{trips.filter(t => t.status === 'planned').length}</Text>
              <Text className="text-xs text-gray-600">Planejadas</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-yellow-600">{trips.filter(t => t.status === 'ongoing').length}</Text>
              <Text className="text-xs text-gray-600">Em Andamento</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">{trips.filter(t => t.status === 'completed').length}</Text>
              <Text className="text-xs text-gray-600">Concluídas</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-600">{trips.length}</Text>
              <Text className="text-xs text-gray-600">Total</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de viagens */}
      <ScrollView
        className="flex-1 px-6"
        style={{ paddingTop: 24 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500">Carregando viagens...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="airplane-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">Nenhuma viagem ainda</Text>
            <Text className="text-gray-500 text-center px-8 mb-6">
              Que tal planejar sua primeira aventura em casal?
            </Text>
            <TouchableOpacity 
              className="bg-blue-500 px-6 py-3 rounded-xl"
              onPress={() => setShowCreateModal(true)}
            >
              <Text className="text-white font-semibold">Criar Primeira Viagem</Text>
            </TouchableOpacity>
          </View>
        ) : (
          trips.map((trip) => {
            const statusColors = getStatusColor(trip.status);
            return (
              <TouchableOpacity
                key={trip.id}
                className="bg-white rounded-2xl mb-4 overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  elevation: 4,
                }}
                onPress={() => {
                  setSelectedTrip(trip);
                  setShowDetailsModal(true);
                }}
              >
                <View className="p-5">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-lg font-bold text-gray-900 flex-1">{trip.name}</Text>
                        <View 
                          className="px-2 py-1 rounded-full ml-2"
                          style={{ backgroundColor: statusColors.bg }}
                        >
                          <Text 
                            className="text-xs font-semibold"
                            style={{ color: statusColors.text }}
                          >
                            {getStatusText(trip.status)}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-600 text-sm mb-1">{trip.mainDestination}</Text>
                      <Text className="text-blue-600 text-xs font-medium">{formatPeriod(trip.estimatedPeriod)}</Text>
                    </View>
                  </View>
                  
                  {trip.description && (
                    <Text className="text-gray-500 text-sm mt-2" numberOfLines={2}>
                      {trip.description}
                    </Text>
                  )}
                </View>
                <View 
                  className="h-1"
                  style={{ backgroundColor: statusColors.color }}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
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
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" color="white" size={28} />
      </TouchableOpacity>

      {/* Bottom Navigation */}
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
          <TouchableOpacity className="items-center py-2" onPress={() => router.push('/dashboard')}>
            <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mb-1">
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </View>
            <Text className="text-xs text-gray-500 font-medium">Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2">
            <View className="w-10 h-10 bg-blue-500 rounded-xl items-center justify-center mb-1" style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              <Ionicons name="airplane" size={20} color="white" />
            </View>
            <Text className="text-xs text-blue-600 font-semibold">Viagens</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2">
            <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mb-1">
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <Text className="text-xs text-gray-500 font-medium">Configurações</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}