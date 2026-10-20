// LocationManager.swift
// AURIX Native iOS Companion App - CoreLocation Service

import Foundation
import CoreLocation
import Combine

public final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    
    @Published public var authorizationStatus: CLAuthorizationStatus
    @Published public var lastLocation: CLLocation?
    @Published public var isSharingActive: Bool = false
    
    public override init() {
        self.authorizationStatus = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
    }
    
    public func requestPermissions() {
        manager.requestWhenInUseAuthorization()
    }
    
    public func startLocationSharing() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            print("[AURIX-iOS] Permission not granted.")
            return
        }
        isSharingActive = true
        manager.startUpdatingLocation()
        print("[AURIX-iOS] CoreLocation tracking started with explicit user consent.")
    }
    
    public func stopLocationSharing() {
        isSharingActive = false
        manager.stopUpdatingLocation()
        print("[AURIX-iOS] CoreLocation tracking stopped by user.")
    }
    
    // CLLocationManagerDelegate
    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async {
            self.authorizationStatus = manager.authorizationStatus
        }
    }
    
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard isSharingActive, let location = locations.last else { return }
        DispatchQueue.main.async {
            self.lastLocation = location
        }
        syncToSupabase(location: location)
    }
    
    private func syncToSupabase(location: CLLocation) {
        let url = URL(string: "https://widxmdxquqzkkbpmwtrg.supabase.co/rest/v1/location_updates")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHhtZHhxdXF6a2ticG13dHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzk2NzIsImV4cCI6MjA2MjI1NTY3Mn0.XfP_Q2pY9c7T3pL_4Pq1m8N5w2E_Z9X0R4Y7Q6P8M3I", forHTTPHeaderField: "Authorization")
        request.setValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHhtZHhxdXF6a2ticG13dHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzk2NzIsImV4cCI6MjA2MjI1NTY3Mn0.XfP_Q2pY9c7T3pL_4Pq1m8N5w2E_Z9X0R4Y7Q6P8M3I", forHTTPHeaderField: "apikey")
        
        let payload: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "timestamp": ISO8601DateFormatter().string(from: location.timestamp)
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        
        URLSession.shared.dataTask(with: request) { _, response, error in
            if let error = error {
                print("[AURIX-iOS] Location sync error: \(error.localizedDescription)")
            } else {
                print("[AURIX-iOS] Location synced successfully.")
            }
        }.resume()
    }
}
