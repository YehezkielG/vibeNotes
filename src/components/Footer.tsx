export default function Footer() { 
    return (
        <footer className="w-full pb-1 text-gray-500">
            &copy; {new Date().getFullYear()} VibeNotes. All rights reserved, Terms of Service, Privacy Policy.
        </footer>
    );
}