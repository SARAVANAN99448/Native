import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface SolarResults {
    annualSavings: number;
    lifetimeSavings: number;
    systemSize: number;
    paybackPeriod: number;
}

export default function SolarCalculator() {
    const [billAmount, setBillAmount] = useState<string>("3,000");
    const [results, setResults] = useState<SolarResults | null>(null);

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat("en-IN").format(num);
    };

    const calculateSolarSavings = (biMonthlyBill: number): SolarResults => {
        const annualBill = biMonthlyBill * 6;
        const annualSavings = annualBill;
        const lifetimeSavings = annualSavings * 25;
        const systemSize = Math.round((biMonthlyBill / 1900) * 10) / 10;
        const paybackPeriod = 3;

        return {
            annualSavings,
            lifetimeSavings,
            systemSize,
            paybackPeriod,
        };
    };

    const handleInputChange = (text: string): void => {
        let clean = text.replace(/[^\d]/g, "");
        if (clean) {
            let formatted = parseInt(clean).toLocaleString("en-IN");
            setBillAmount(formatted);
            const amount = parseFloat(clean);
            if (amount >= 2500 && amount <= 50000) {
                setResults(calculateSolarSavings(amount));
            } else {
                setResults(null);
            }
        } else {
            setBillAmount("");
            setResults(null);
        }
    };
    const handleBookVisit = () => {
        router.push("/customer/screens/BookVisit");
    }
    useEffect(() => {
        setResults(calculateSolarSavings(3000));
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <Text style={styles.headerTitle}>Calculate your Solar Benefit now!</Text>

                {/* Input Section */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="3000"
                        placeholderTextColor="#888"
                        value={billAmount}
                        onChangeText={handleInputChange}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity
                        style={styles.calculateButton}
                        onPress={() => {
                            const amount = parseFloat(billAmount.replace(/,/g, ""));
                            if (amount >= 2500 && amount <= 50000) {
                                setResults(calculateSolarSavings(amount));
                            }
                        }}
                    >
                        <Text style={styles.calculateButtonText}>Calculate</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.validationText}>
                    Enter your 2-month electricity bill (₹2500 - ₹50,000)
                </Text>

                {/* Results */}
                {results && (
                    <View style={styles.resultsContainer}>
                        <ImageBackground
                            source={require('../../../assets/images/solar.jpg')}
                            style={styles.resultsBackground}
                            blurRadius={0}
                            resizeMode="cover"
                            imageStyle={styles.resultsBackgroundImage}
                        >
                            {/* Top Row - Annual & Lifetime */}
                            <View style={styles.topRow}>
                                <View style={styles.savingsCard}>
                                    <Text style={styles.savingsLabel}>Annual savings</Text>
                                    <Text style={styles.savingsAmount}>₹{formatNumber(results.annualSavings)}</Text>
                                </View>
                                <View style={styles.savingsCard}>
                                    <Text style={styles.savingsLabel}>Lifetime savings</Text>
                                    <Text style={styles.savingsAmount}>₹{formatNumber(results.lifetimeSavings)}</Text>
                                </View>
                            </View>

                            {/* Bottom Row - Solar & Payback */}
                            <View style={styles.bottomRow}>
                                <View style={styles.savingsCard}>
                                    <Text style={styles.savingsLabel}>Recommended Solar</Text>
                                    <Text style={styles.savingsAmount}>{results.systemSize} kW</Text>
                                </View>
                                <View style={styles.savingsCard}>
                                    <Text style={styles.savingsLabel}>Return on Investment</Text>
                                    <Text style={styles.savingsAmount}>3.5 - 4 yrs</Text>
                                </View>
                            </View>


                        </ImageBackground>
                    </View>

                )}
                <View>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={handleBookVisit}>
                        <Text style={styles.bookButtonText}>Book Visit</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        backgroundColor: '#F5F5F5'
    },
    content: {
        flexGrow: 1,
        padding: 24,
    },
    bookButton: {
        backgroundColor: "#e68123",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    bookButtonText: { fontSize: 18, fontWeight: "700", color: "#fff" },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold" as const,
        color: "#e68123",
        textAlign: "center",
        marginBottom: 32,
    },
    inputContainer: {
        backgroundColor: "#F8F9FF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 36,
        fontWeight: "800" as const,
        color: "#333",
        textAlign: "center",
        backgroundColor: "transparent",
        height: 60,
    },
    calculateButton: {
        backgroundColor: "#e68123",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        minWidth: 120,
        alignItems: "center",
    },
    calculateButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700" as const,
    },
    validationText: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        marginBottom: 40,
    },
    resultsContainer: {
        borderRadius: 20,
        marginBottom: 24,
        overflow: 'hidden',  // Clips image to rounded corners
    },
    resultsBackground: {
        flex: 1,
        minHeight: 420,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsBackgroundImage: {
        opacity: 0.2,
   
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
        width: '100%',
    },
    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        width: '100%',
    },
    savingsCard: {
        flex: 1,
        backgroundColor: "rgba(138, 137, 137, 0.2)",
        borderRadius: 16,
        padding: 4,
        alignItems: "center",
        minHeight: 100,
    },
    savingsLabel: {
        fontSize: 14,
        color: "#e68123",
        marginBottom: 8,
        fontWeight:"bold"
    },
    savingsAmount: {
        fontSize: 24,
        fontWeight: "bold" as const,
        color: "#0000",
    },
    solarImage: {
        alignItems: "center",
        marginTop: 20,
    },
});
