import Foundation

enum APIError: Error {
    case invalidURL
    case server(Int)
    case decoding
    case unauthorized
}

struct EmptyResponse: Decodable {}

/// Thin wrapper around URLSession that talks to the Tesla Companion backend
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
        request.httpBody = endpoint.body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
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
            throw APIError.decoding
        }
    }
}
