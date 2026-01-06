"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';

interface CertificateTemplateProps {
  recipientName: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  institutionName: string;
  organizationLogo?: string;
  transactionHash: string;
  uniqueIdentifier: string;
  certificateNumber?: string;
}

export default function CertificateTemplate({
  recipientName,
  recipientPosition,
  credentialType,
  issueDate,
  institutionName,
  organizationLogo,
  transactionHash,
  uniqueIdentifier,
  certificateNumber,
}: CertificateTemplateProps) {
  const explorerUrl = `https://cardanoscan.io/transaction/${transactionHash}`;
  
  return (
    <Card className="relative w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-white to-gray-50 border-4 border-primary">
      {/* Organization Logo */}
      {organizationLogo && (
        <div className="absolute top-8 left-8 w-20 h-20">
          <img 
            src={organizationLogo} 
            alt={`${institutionName} logo`}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Certificate of {credentialType}</h1>
        <div className="w-32 h-1 bg-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">
          Blockchain-Verified Digital Credential
        </p>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-6 mb-8">
        <p className="text-lg text-muted-foreground">
          This is to certify that
        </p>
        
        <h2 className="text-5xl font-bold text-foreground">
          {recipientName}
        </h2>
        
        <p className="text-xl text-muted-foreground">
          has successfully completed the requirements for
        </p>
        
        <h3 className="text-3xl font-semibold text-primary">
          {credentialType}
        </h3>
        
        <p className="text-lg text-muted-foreground">
          as a <span className="font-medium text-foreground">{recipientPosition}</span>
        </p>
      </div>

      {/* Institution Info */}
      <div className="text-center mb-8">
        <p className="text-xl font-medium text-foreground">
          {institutionName}
        </p>
        <p className="text-sm text-muted-foreground">
          Date of Issue: {new Date(issueDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Blockchain Verification Section */}
      <div className="border-t-2 border-primary pt-6 mt-6">
        <div className="flex justify-between items-start gap-8">
          {/* Left: Certificate Details */}
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-sm text-foreground mb-3">
              Blockchain Verification
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Certificate ID:</span>
                <span className="font-mono font-medium">{certificateNumber || uniqueIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unique Identifier:</span>
                <span className="font-mono font-medium">{uniqueIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TX Hash:</span>
                <span className="font-mono font-medium text-xs truncate max-w-[200px]">
                  {transactionHash.substring(0, 16)}...
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              This certificate is permanently recorded on the Cardano blockchain.
              Scan the QR code or visit the transaction link to verify authenticity.
            </p>
          </div>

          {/* Right: QR Code */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-lg border-2 border-primary">
              <QRCodeSVG
                value={explorerUrl}
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan to verify
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by LiteCert - Blockchain Certificate Verification System
        </p>
      </div>
    </Card>
  );
}
