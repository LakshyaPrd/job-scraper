'use client';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onDeleteTab?: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange, onDeleteTab }: TabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-orange-200">
        <nav className="flex flex-wrap gap-1 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                    ${isActive 
                      ? 'border-orange-500 text-orange-600 bg-orange-50/50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-orange-300'
                    }
                  `}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`
                      px-2 py-0.5 text-xs font-semibold rounded-full
                      ${isActive 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
                
                {/* Delete button - show on hover for non-All tabs */}
                {tab.id !== 'All' && onDeleteTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete all jobs in \"${tab.label}\"?`)) {
                        onDeleteTab(tab.id);
                      }
                    }}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity
                              w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600
                              flex items-center justify-center shadow-sm"
                    title={`Delete ${tab.label}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
