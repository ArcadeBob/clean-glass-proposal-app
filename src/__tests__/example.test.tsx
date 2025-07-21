import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

describe('Example Test', () => {
  it('should render without crashing', () => {
    const { getByTestId, getByText } = render(<div data-testid="test-element">Hello World</div>)
    
    expect(getByTestId('test-element')).toBeInTheDocument()
    expect(getByText('Hello World')).toBeInTheDocument()
  })

  it('should have proper testing environment', () => {
    expect(window).toBeDefined()
    expect(document).toBeDefined()
  })
}) 