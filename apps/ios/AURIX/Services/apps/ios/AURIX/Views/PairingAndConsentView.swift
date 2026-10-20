// PairingAndConsentView.swift
// AURIX Native iOS Companion App - Pairing & Consent UI

import SwiftUI
import CoreLocation

struct PairingAndConsentView: View {
    @StateObject private var locationManager = LocationManager()
    @State private var pairingCode: String = ""
    @State private var isPaired: Bool = false
    @State private var statusMessage: String = "أدخل رمز الإقران المكون من 6 أرقام للبدء"
    
    var body: some View {
        ZStack {
            Color(hex: "#090A0D").ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Header Logo
                HStack {
                    Circle()
                        .fill(Color(hex: "#C6A15B"))
                        .frame(width: 12, height: 12)
                    Text("AURIX")
                        .font(.system(size: 24, weight: .black, design: .monospaced))
                        .foregroundColor(Color(hex: "#C6A15B"))
                    Spacer()
                    Text("iOS Core")
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(hex: "#171A20"))
                        .foregroundColor(Color(hex: "#A3A7B0"))
                        .cornerRadius(6)
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Pairing Box
                if !isPaired {
                    VStack(spacing: 16) {
                        Image(systemName: "key.fill")
                            .font(.system(size: 40))
                            .foregroundColor(Color(hex: "#C6A15B"))
                        
                        Text("إقران جهاز آيفون")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text(statusMessage)
                            .font(.caption)
                            .foregroundColor(Color(hex: "#A3A7B0"))
                            .multilineTextAlignment(.center)
                        
                        TextField("000000", text: $pairingCode)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.center)
                            .font(.system(size: 28, weight: .bold, design: .monospaced))
                            .padding()
                            .background(Color(hex: "#171A20"))
                            .foregroundColor(Color(hex: "#C6A15B"))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: "#C6A15B").opacity(0.3), lineWidth: 1)
                            )
                        
                        Button(action: verifyAndPair) {
                            Text("تاكيد الإقران والموافقة")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(hex: "#C6A15B"))
                                .cornerRadius(12)
                        }
                    }
                    .padding(24)
                    .background(Color(hex: "#111318"))
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color(hex: "#C6A15B").opacity(0.2), lineWidth: 1)
                    )
                    .padding(.horizontal)
                } else {
                    // Controls after pairing
                    VStack(spacing: 20) {
                        Image(systemName: "checkmark.shield.fill")
                            .font(.system(size: 48))
                            .foregroundColor(Color(hex: "#36B37E"))
                        
                        Text("الجهاز مرتبط بنجاح")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Toggle("مشاركة الموقع (Live GPS)", isOn: $locationManager.isSharingActive)
                            .onChange(of: locationManager.isSharingActive) { value in
                                if value {
                                    locationManager.startLocationSharing()
                                } else {
                                    locationManager.stopLocationSharing()
                                }
                            }
                            .padding()
                            .background(Color(hex: "#171A20"))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                        
                        Button(action: {
                            locationManager.stopLocationSharing()
                            isPaired = false
                        }) {
                            Text("إلغاء ربط الجهاز")
                                .font(.caption)
                                .foregroundColor(Color(hex: "#E05260"))
                        }
                    }
                    .padding(24)
                    .background(Color(hex: "#111318"))
                    .cornerRadius(20)
                    .padding(.horizontal)
                }
                
                Spacer()
            }
        }
    }
    
    private func verifyAndPair() {
        guard pairingCode.count == 6 else {
            statusMessage = "يرجى إدخال رمز مكون من 6 أرقام"
            return
        }
        locationManager.requestPermissions()
        isPaired = true
    }
}

// Color Extension Helper
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumericCharacters.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = (int >> 16, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (1, 1, 1)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: 1
        )
    }
}
