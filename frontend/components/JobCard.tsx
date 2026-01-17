import React from 'react';
import { Job } from '../types';
import { ExternalLink, MapPin, Building2, Bookmark, Sparkles, Check } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onToggleSave: (id: string) => void;
  onOpenActions: (job: Job) => void;
}

const PlatformBadge: React.FC<{ platform: Job['platform'] }> = ({ platform }) => {
  const styles = {
    '104': 'bg-orange-50 text-orange-700 border-orange-100',
    '1111': 'bg-red-50 text-red-700 border-red-100',
    'CakeResume': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'LinkedIn': 'bg-sky-50 text-sky-700 border-sky-100',
    'Other': 'bg-gray-50 text-gray-700 border-gray-100'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${styles[platform] || styles.Other}`}>
      {platform}
    </span>
  );
};

export const JobCard: React.FC<JobCardProps> = ({ job, onToggleSave, onOpenActions }) => {
  return (
    <div className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col h-full relative">
      
      <div className="flex justify-between items-start mb-4">
        <PlatformBadge platform={job.platform} />
        <div className="flex items-center space-x-1">
           <button 
             onClick={() => onToggleSave(job.id)}
             className={`p-1.5 rounded-full transition-colors ${job.saved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
             title={job.saved ? "Unsave" : "Save Job"}
           >
             <Bookmark className={`w-4 h-4 ${job.saved ? 'fill-current' : ''}`} />
           </button>
           <a 
            href={job.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
            title="Open Link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
        {job.title}
      </h3>
      
      <div className="flex items-center text-gray-600 mb-4">
        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
        <span className="text-sm font-medium line-clamp-1">{job.company}</span>
      </div>
      
      <div className="space-y-2 mb-6 flex-grow">
        {job.location && (
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-3.5 h-3.5 mr-2.5 text-gray-400" />
            {job.location}
          </div>
        )}
        <div className="flex items-center text-gray-500 text-sm">
           <span className="w-3.5 h-3.5 mr-2.5 flex items-center justify-center text-gray-400 font-serif font-bold text-xs">$</span>
           {job.salary}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-100">
        <button 
          onClick={() => onOpenActions(job)}
          className="w-full py-2 flex items-center justify-center text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 mr-2" />
          AI Actions
        </button>
      </div>
    </div>
  );
};