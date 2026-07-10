interface SectionHeaderProps {
  title: string;
  description?: string;
}

export default function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="text-center p-4">
      <h2
        className="text-3xl font-bold text-white mb-2 md:mb-4 font-[Open_Sans]"
        style={{
          textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
        }}
      >
        {title}
      </h2>
      <div className="bg-gradient-left-right min-h-1 w-full md:w-2/3 mx-auto"></div>
      {description && (
        <p className="text-md md:text-lg text-gray-500 w-full md:w-2/3 mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
