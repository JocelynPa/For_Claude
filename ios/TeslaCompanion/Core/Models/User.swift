import Foundation

enum SubscriptionStatus: String, Codable {
    case free, trial, premium
}

struct AppUser: Codable, Hashable {
    var id: String
    var email: String
    var displayName: String
    var subscription: SubscriptionStatus
}
