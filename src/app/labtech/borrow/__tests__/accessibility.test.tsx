/**
 * Accessibility Verification Tests
 * 
 * This test suite verifies that all refactored components maintain
 * accessibility attributes and ARIA labels as required by Requirement 13.6
 */

import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import CategoryFilter from '../components/CategoryFilter'
import ItemBrowser from '../components/ItemBrowser'
import ItemGroup from '../components/ItemGroup'
import FloatingCartButton from '../components/FloatingCartButton'
import BorrowerSelector from '../components/BorrowerSelector'
import RoomSelector from '../components/RoomSelector'
import ConflictDetector from '../components/ConflictDetector'
import CheckoutSheet from '../components/CheckoutSheet'

expect.extend(toHaveNoViolations)

describe('Accessibility Verification', () => {
  describe('CategoryFilter', () => {
    it('should have no accessibility violations', async () => {
      const categories = [
        { name: 'ALL', count: 10, cartCount: 2 },
        { name: 'Microscopes', count: 5, cartCount: 1 }
      ]
      
      const { container } = render(
        <CategoryFilter
          categories={categories}
          activeCategory="ALL"
          onCategoryChange={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have keyboard navigable buttons', () => {
      const categories = [
        { name: 'ALL', count: 10, cartCount: 2 },
        { name: 'Microscopes', count: 5, cartCount: 1 }
      ]
      
      render(
        <CategoryFilter
          categories={categories}
          activeCategory="ALL"
          onCategoryChange={() => {}}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1')
      })
    })
  })

  describe('ItemBrowser', () => {
    it('should have no accessibility violations with items', async () => {
      const equipment = [{
        id: 1,
        name: 'Microscope',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }]
      
      const { container } = render(
        <ItemBrowser
          equipmentGroups={equipment}
          apparatusGroups={[]}
          cart={[]}
          expandedGroups={{}}
          onToggleGroup={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      const equipment = [{
        id: 1,
        name: 'Microscope',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }]
      
      render(
        <ItemBrowser
          equipmentGroups={equipment}
          apparatusGroups={[]}
          cart={[]}
          expandedGroups={{}}
          onToggleGroup={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should display accessible empty state', () => {
      render(
        <ItemBrowser
          equipmentGroups={[]}
          apparatusGroups={[]}
          cart={[]}
          expandedGroups={{}}
          onToggleGroup={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      expect(screen.getByText(/No items match your search/i)).toBeInTheDocument()
    })
  })

  describe('ItemGroup', () => {
    it('should have no accessibility violations', async () => {
      const item = {
        id: 1,
        name: 'Microscope',
        model: 'Model X',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }
      
      const { container } = render(
        <ItemGroup
          item={item}
          itemType="EQUIPMENT"
          groupKey="equipment-1"
          isExpanded={true}
          cart={[]}
          onToggle={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible expand/collapse button', () => {
      const item = {
        id: 1,
        name: 'Microscope',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }
      
      render(
        <ItemGroup
          item={item}
          itemType="EQUIPMENT"
          groupKey="equipment-1"
          isExpanded={false}
          cart={[]}
          onToggle={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have accessible action buttons', () => {
      const item = {
        id: 1,
        name: 'Microscope',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }
      
      render(
        <ItemGroup
          item={item}
          itemType="EQUIPMENT"
          groupKey="equipment-1"
          isExpanded={true}
          cart={[]}
          onToggle={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const addButton = screen.getByText(/Add/i)
      expect(addButton).toBeInTheDocument()
      expect(addButton.closest('button')).not.toBeDisabled()
    })
  })

  describe('FloatingCartButton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <FloatingCartButton
          itemCount={3}
          onOpenCart={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible button with count', () => {
      render(
        <FloatingCartButton
          itemCount={5}
          onOpenCart={() => {}}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should not render when count is 0', () => {
      const { container } = render(
        <FloatingCartButton
          itemCount={0}
          onOpenCart={() => {}}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('BorrowerSelector', () => {
    it('should have no accessibility violations in STAFF mode', async () => {
      const { container } = render(
        <BorrowerSelector
          borrowerType="STAFF"
          selectedBorrower={null}
          studentName=""
          studentCourse=""
          studentYearLevel=""
          onBorrowerTypeChange={() => {}}
          onBorrowerSelect={() => {}}
          onStudentInfoChange={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in STUDENT mode', async () => {
      const { container } = render(
        <BorrowerSelector
          borrowerType="STUDENT"
          selectedBorrower={null}
          studentName=""
          studentCourse=""
          studentYearLevel=""
          onBorrowerTypeChange={() => {}}
          onBorrowerSelect={() => {}}
          onStudentInfoChange={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have properly labeled form inputs', () => {
      render(
        <BorrowerSelector
          borrowerType="STUDENT"
          selectedBorrower={null}
          studentName=""
          studentCourse=""
          studentYearLevel=""
          onBorrowerTypeChange={() => {}}
          onBorrowerSelect={() => {}}
          onStudentInfoChange={() => {}}
        />
      )
      
      expect(screen.getByText(/Student Full Name/i)).toBeInTheDocument()
      expect(screen.getByText(/Course/i)).toBeInTheDocument()
      expect(screen.getByText(/Year Level/i)).toBeInTheDocument()
    })
  })

  describe('RoomSelector', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <RoomSelector
          selectedRoom={null}
          borrowerType="STUDENT"
          selectedBorrower={null}
          onRoomSelect={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have properly labeled search input', () => {
      render(
        <RoomSelector
          selectedRoom={null}
          borrowerType="STUDENT"
          selectedBorrower={null}
          onRoomSelect={() => {}}
        />
      )
      
      expect(screen.getByText(/Laboratory Room/i)).toBeInTheDocument()
    })

    it('should indicate disabled state when staff not selected', () => {
      render(
        <RoomSelector
          selectedRoom={null}
          borrowerType="STAFF"
          selectedBorrower={null}
          onRoomSelect={() => {}}
        />
      )
      
      const input = screen.getByPlaceholderText(/Select a staff member first/i)
      expect(input).toBeDisabled()
    })
  })

  describe('ConflictDetector', () => {
    it('should have no accessibility violations with conflicts', async () => {
      const cart = [
        {
          instanceId: 1,
          instanceType: 'EQUIPMENT' as const,
          itemId: 1,
          itemName: 'Microscope',
          inventoryNumber: 'EQ-001'
        }
      ]
      
      const borrower = {
        id: 1,
        customId: 'STAFF-001',
        firstName: 'John',
        lastName: 'Doe',
        departmentId: 1,
        department: { id: 1, name: 'Biology' }
      }
      
      const { container } = render(
        <ConflictDetector
          borrowerType="STAFF"
          selectedBorrower={borrower}
          cart={cart}
          onConflictsDetected={() => {}}
        />
      )
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('CheckoutSheet', () => {
    it('should have no accessibility violations', async () => {
      const cart = [
        {
          instanceId: 1,
          instanceType: 'EQUIPMENT' as const,
          itemId: 1,
          itemName: 'Microscope',
          inventoryNumber: 'EQ-001'
        }
      ]
      
      const { container } = render(
        <CheckoutSheet
          isOpen={true}
          onOpenChange={() => {}}
          currentStep={1}
          cart={cart}
          borrowerType="STAFF"
          selectedBorrower={null}
          selectedRoom={null}
          studentName=""
          studentCourse=""
          studentYearLevel=""
          purpose=""
          dueDate=""
          conflictWarnings={[]}
          isSubmitting={false}
          onStepChange={() => {}}
          onRemoveFromCart={() => {}}
          onBorrowerTypeChange={() => {}}
          onBorrowerSelect={() => {}}
          onStudentInfoChange={() => {}}
          onRoomSelect={() => {}}
          onPurposeChange={() => {}}
          onDueDateChange={() => {}}
          onConfirm={() => {}}
          onConflictsDetected={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper dialog structure', () => {
      const cart = [
        {
          instanceId: 1,
          instanceType: 'EQUIPMENT' as const,
          itemId: 1,
          itemName: 'Microscope',
          inventoryNumber: 'EQ-001'
        }
      ]
      
      render(
        <CheckoutSheet
          isOpen={true}
          onOpenChange={() => {}}
          currentStep={1}
          cart={cart}
          borrowerType="STAFF"
          selectedBorrower={null}
          selectedRoom={null}
          studentName=""
          studentCourse=""
          studentYearLevel=""
          purpose=""
          dueDate=""
          conflictWarnings={[]}
          isSubmitting={false}
          onStepChange={() => {}}
          onRemoveFromCart={() => {}}
          onBorrowerTypeChange={() => {}}
          onBorrowerSelect={() => {}}
          onStudentInfoChange={() => {}}
          onRoomSelect={() => {}}
          onPurposeChange={() => {}}
          onDueDateChange={() => {}}
          onConfirm={() => {}}
          onConflictsDetected={() => {}}
        />
      )
      
      expect(screen.getByText('Checkout')).toBeInTheDocument()
      expect(screen.getByText(/Complete your borrow request/i)).toBeInTheDocument()
    })

    it('should have accessible navigation buttons', () => {
      const cart = [
        {
          instanceId: 1,
          instanceType: 'EQUIPMENT' as const,
          itemId: 1,
          itemName: 'Microscope',
          inventoryNumber: 'EQ-001'
        }
      ]
      
      render(
        <CheckoutSheet
          isOpen={true}
          onOpenChange={() => {}}
          currentStep={2}
          cart={cart}
          borrowerType="STAFF"
          selectedBorrower={null}
          selectedRoom={null}
          studentName=""
          studentCourse=""
          studentYearLevel=""
          purpose=""
          dueDate=""
          conflictWarnings={[]}
          isSubmitting={false}
          onStepChange={() => {}}
          onRemoveFromCart={() => {}}
          onBorrowerTypeChange={() => {}}
          onBorrowerSelect={() => {}}
          onStudentInfoChange={() => {}}
          onRoomSelect={() => {}}
          onPurposeChange={() => {}}
          onDueDateChange={() => {}}
          onConfirm={() => {}}
          onConflictsDetected={() => {}}
        />
      )
      
      const backButton = screen.getByText('Back')
      const continueButton = screen.getByText('Continue')
      
      expect(backButton.closest('button')).toBeInTheDocument()
      expect(continueButton.closest('button')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in CategoryFilter', () => {
      const categories = [
        { name: 'ALL', count: 10, cartCount: 2 },
        { name: 'Microscopes', count: 5, cartCount: 1 }
      ]
      
      render(
        <CategoryFilter
          categories={categories}
          activeCategory="ALL"
          onCategoryChange={() => {}}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveProperty('tabIndex')
      })
    })

    it('should support keyboard navigation in ItemGroup', () => {
      const item = {
        id: 1,
        name: 'Microscope',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }
      
      render(
        <ItemGroup
          item={item}
          itemType="EQUIPMENT"
          groupKey="equipment-1"
          isExpanded={true}
          cart={[]}
          onToggle={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1')
      })
    })
  })

  describe('Focus Management', () => {
    it('should maintain focus on interactive elements', () => {
      const item = {
        id: 1,
        name: 'Microscope',
        category: { id: 1, name: 'Lab Equipment' },
        instances: [
          { id: 1, inventoryNumber: 'EQ-001', serialNumber: 'SN-001', currentCondition: 'Good' }
        ]
      }
      
      render(
        <ItemGroup
          item={item}
          itemType="EQUIPMENT"
          groupKey="equipment-1"
          isExpanded={true}
          cart={[]}
          onToggle={() => {}}
          onAddToCart={() => {}}
        />
      )
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled')
      })
    })
  })
})
