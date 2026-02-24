interface LoadingSpinnerProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

const LoadingSpinner = ({ fullScreen = false, size = 'md', label }: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-[3px]',
        lg: 'w-12 h-12 border-4',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-primary-200 dark:border-dark-600 border-t-primary-500 dark:border-t-primary-400 rounded-full animate-spin`}
            />
            {label && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{label}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-dark-900 z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
