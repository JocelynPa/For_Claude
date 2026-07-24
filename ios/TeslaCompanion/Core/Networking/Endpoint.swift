import Foundation

struct Endpoint {
    var path: String
    var method: String = "GET"
    var query: [URLQueryItem] = []
    var body: Data? = nil
}
