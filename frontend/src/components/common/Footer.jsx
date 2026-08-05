import React from 'react';
import { Brain } from 'lucide-react';
export const Footer = () => {
    return (<footer className="border-t border-white/5 bg-[#070911] py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center space-x-2 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brandPrimary text-white shadow-md shadow-brandPrimary/10">
            <Brain className="h-4 w-4"/>
          </div>
          <span className="font-bold tracking-tight">InterVexa AI</span>
        </div>
        <p className="text-center text-xs text-textMuted md:text-left">
          &copy; {new Date().getFullYear()} InterVexa AI. All rights reserved. Portfolio-worthy Placement Preparation Platform.
        </p>
      </div>
    </footer>);
};
export default Footer;
