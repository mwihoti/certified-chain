/// Datum stored inline at the contract UTxO for each issued certificate.
/// Only hashes are stored on-chain — no personal data.
pub type CertificateDatum {
  /// Payment key hash of the institution that issued the certificate.
  /// Only this key can revoke.
  institution_pkh: ByteArray,
  /// SHA-256 hash of the full certificate data (name, credential, date, etc.)
  certificate_hash: ByteArray,
  /// Unique identifier, e.g. "FKF_KOM_01" — UTF-8 encoded as bytes
  unique_identifier: ByteArray,
  /// Unix timestamp (seconds) when the certificate was issued
  issued_at: Int,
  /// Whether this certificate has been revoked on-chain
  is_revoked: Bool,
}

/// Actions that can be performed on a certificate UTxO.
pub type CertificateRedeemer {
  /// Institution revokes the certificate — spends the UTxO
  Revoke
}
