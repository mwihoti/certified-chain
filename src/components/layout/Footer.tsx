import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span>LiteCert</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Secure, blockchain-verified certificates on Cardano. 
              Immutable credentials you can trust.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/institution" className="hover:text-foreground transition-colors">
                  Institution Portal
                </Link>
              </li>
              <li>
                <Link to="/user" className="hover:text-foreground transition-colors">
                  Retrieve Certificate
                </Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-foreground transition-colors">
                  Verify Certificate
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  How It Works
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Security
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Contact
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LiteCert. Powered by Cardano blockchain.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;