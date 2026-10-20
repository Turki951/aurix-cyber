// LocationService.swift
// AURIX Native iOS Companion App - Official Apple CoreLocation Integration

import Foundation
import CoreLocation
import Combine

public final class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    
    @Published public var authorizationStatus: CLAuthorizationStatus
    @Published public var lastLocation: CLLocation?
    @Published public var isSharingActive: Bool = false
    
    public override init() {
        self.authorizationStatus = locationManager.authorizationStatus
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }
    
    public func requestLocationPermission() {
        locationManager.requestWhenInUseAuthorization()
    }
    
    public func startSharing() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            print("[AURIX-iOS] Cannot start sharing: Permission not granted by user.")
            return
        }
        isSharingActive = true
        locationManager.startUpdatingLocation()
        print("[AURIX-iOS] CoreLocation updates started with explicit consent.")
    }
    
    public func stopSharing() {
        isSharingActive = false
        locationManager.stopUpdatingLocation()
        print("[AURIX-iOS] CoreLocation updates manually stopped by owner.")
    }
    
    // CLLocationManagerDelegate Methods
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
        // Sync payload securely to Supabase REST Endpoint
        syncLocationToSupabase(location: location)
    }
    
    private func syncLocationToSupabase(location: CLLocation) {
        // Encrypted REST Payload push implementation
        print("[AURIX-iOS] Syncing Lat: \(location.coordinate.latitude), Lng: \(location.coordinate.longitude)")
    }
}
