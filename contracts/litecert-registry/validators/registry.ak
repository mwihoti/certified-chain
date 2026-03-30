use aiken/collection/list
use cardano/transaction.{OutputReference, Transaction}
use litecert/types.{CertificateDatum, CertificateRedeemer, Revoke}

/// LiteCert Certificate Registry Validator
///
/// Each issued certificate locks a small UTxO (min-ADA) at this contract address.
/// The inline datum stores the certificate hash and issuing institution key hash.
///
/// The only allowed action is Revoke — which spends the UTxO and can only be
/// authorised by the institution that originally issued the certificate.
///
/// Verification flow:
///   1. Look up the UTxO at this address by the certificate's txHash
///   2. Decode the inline datum
///   3. Recompute the certificate hash from the raw data
///   4. Compare with datum.certificate_hash
///   5. Confirm datum.is_revoked == False
validator certificate_registry {
  spend(
    datum: Option<CertificateDatum>,
    redeemer: CertificateRedeemer,
    _output_reference: OutputReference,
    tx: Transaction,
  ) -> Bool {
    when datum is {
      // No datum — reject
      None -> False

      Some(d) ->
        when redeemer is {
          // Only the original institution (by pkh) can revoke
          Revoke ->
            list.has(tx.extra_signatories, d.institution_pkh)
        }
    }
  }

  // Reject all other spending purposes (minting, withdrawals, etc.)
  else(_) -> False
}
