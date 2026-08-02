import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case server(Int)
    case decoding(String)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            "URL invalide."
        case .server(let status):
            "Le serveur a répondu avec le code \(status)."
        case .decoding(let details):
            "Réponse du serveur illisible (\(details))."
        case .unauthorized:
            "Session expirée, reconnectez-vous."
        }
    }
}

struct EmptyResponse: Decodable {}

/// Thin wrapper around URLSession that talks to the Sentinel Mode backend
/// (never directly to Tesla's Fleet API — that requires signed requests the
/// backend handles on the app's behalf).
final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession

    private init() {
        guard let url = URL(string: AppConfig.apiBaseURL) else {
            fatalError("Invalid API_BASE_URL in Info.plist")
        }
        self.baseURL = url
        self.session = URLSession(configuration: .default)
    }

    @discardableResult
    func send<T: Decodable>(_ endpoint: Endpoint, authToken: String? = nil) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(endpoint.path), resolvingAgainstBaseURL: false)
        components?.queryItems = endpoint.query.isEmpty ? nil : endpoint.query
        guard let url = components?.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        // Only attach a JSON Content-Type when there's an actual body: bodyless
        // POSTs (honk, flash lights, charge start/stop...) with
        // Content-Type: application/json but no body are rejected by Fastify's
        // default JSON parser ("Body cannot be empty").
        if let body = endpoint.body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if let authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.server(-1) }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { throw APIError.unauthorized }
            throw APIError.server(http.statusCode)
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error.localizedDescription)
        }
    }
}
