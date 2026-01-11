'use client';
import Link from 'next/link';
import { Building2, User, ShieldCheck, ArrowRight, Lock, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';



export default function Home() {
  const portals = [
    {
      icon: Building2,
      title: 'Institution Portal',
      description: 'Issue and manage blockchain-verified certificates for your organization.',
      href: '/institution',
      color: 'bg-primary',
    },
    {
      icon: User,
      title: 'Retrieve Certificate',
      description: 'Access your credentials using your certificate number and position.',
      href: '/user',
      color: 'bg-secondary',
    },
    {
      icon: ShieldCheck,
      title: 'Verify Certificate',
      description: 'Instantly verify the authenticity of any certificate on the blockchain.',
      href: '/verify',
      color: 'bg-success',
    },
  ];

  const features = [
    {
      icon: Lock,
      title: 'Immutable & Secure',
      description: 'Certificates are encrypted and stored on IPFS with metadata anchored on Cardano.',
    },
    {
      icon: Globe,
      title: 'Globally Accessible',
      description: 'Access and verify certificates from anywhere, anytime, with internet access.',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Real-time blockchain verification ensures credentials are always authentic.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-success animate-pulse" />
              Powered by Cardano Blockchain
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
              Secure Credentials,{' '}
              <span className="text-primary">Verified Forever</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              LiteCert provides blockchain-based certificate management that allows institutions 
              to issue tamper-proof credentials, and enables instant verification by employers worldwide.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/institution">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/verify">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Verify a Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Portal</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you&apos;re an institution, certificate holder, or employer, 
              LiteCert has you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {portals.map((portal) => (
              <Link key={portal.href} href={portal.href} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${portal.color} flex items-center justify-center mb-4`}>
                      <portal.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      {portal.title}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </CardTitle>
                    <CardDescription>{portal.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why LiteCert?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built on Cardano&apos;s proven blockchain technology for maximum security and reliability.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="mb-8 opacity-90 max-w-lg mx-auto">
            Join institutions worldwide in securing credentials with blockchain technology.
          </p>
          <Link href="/institution/register">
            <Button size="lg" variant="secondary">
              Register Your Institution
            </Button>
          </Link>
        </div>
      </section>

    </Layout>
  );
}
