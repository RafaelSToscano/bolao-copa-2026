import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card element', () => {
      const { container } = render(
        <Card>
          <div>Content</div>
        </Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<Card />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should render with default size', () => {
      const { container } = render(<Card />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveAttribute('data-size', 'default');
    });

    it('should render with sm size', () => {
      const { container } = render(<Card size="sm" />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveAttribute('data-size', 'sm');
    });

    it('should render children', () => {
      render(
        <Card>
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain('custom-class');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      const { container } = render(<CardHeader />);
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardHeader className="custom-class" />
      );
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header?.className).toContain('custom-class');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      const { container } = render(<CardTitle />);
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toBeInTheDocument();
    });

    it('should render with text content', () => {
      render(<CardTitle>My Title</CardTitle>);
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardTitle className="custom-class" />
      );
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title?.className).toContain('custom-class');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      const { container } = render(<CardDescription />);
      const desc = container.querySelector('[data-slot="card-description"]');
      expect(desc).toBeInTheDocument();
    });

    it('should render with text content', () => {
      render(<CardDescription>My Description</CardDescription>);
      expect(screen.getByText('My Description')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardDescription className="custom-class" />
      );
      const desc = container.querySelector('[data-slot="card-description"]');
      expect(desc?.className).toContain('custom-class');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      const { container } = render(<CardContent />);
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(<CardContent>Main Content</CardContent>);
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardContent className="custom-class" />
      );
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content?.className).toContain('custom-class');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      const { container } = render(<CardFooter />);
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardFooter className="custom-class" />
      );
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer?.className).toContain('custom-class');
    });
  });

  describe('CardAction', () => {
    it('should render card action', () => {
      const { container } = render(<CardAction />);
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(<CardAction>Action Content</CardAction>);
      expect(screen.getByText('Action Content')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardAction className="custom-class" />
      );
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action?.className).toContain('custom-class');
    });
  });

  describe('Complete Card Structure', () => {
    it('should render complete card with all sections', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-header"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-title"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-description"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-content"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-footer"]')
      ).toBeInTheDocument();
    });
  });
});
